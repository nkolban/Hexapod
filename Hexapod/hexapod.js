/**
 * Control a hexapod robot.
 * 
 * Author: Neil Kolban, kolban1@kolban.com
 * Date: 2016-06-21
 */

"use strict";
const assert = require("assert");

/**
 * Messages that can be received over the Web Socket are:
 * {
 *   type: <Command Type>
 *   data: <data>
 * }
 * 
 * The following command types are:
 * type: "state"
 * data: {
 *   name: <Name of state>
 *   angles: [array of angles]
 * }
 * 
 * type: "walk"
 * 
 * type: "stop"
 */
// 0   = forward facing/down
// 180 = backward facing/up

// Servo data
// min, max - the minimum and maximum movement values
// invert - Should the angle be inverted 0->180 and 180->0
// servoId
const servoInits = [
                    // default is 700-2600 ... 1900 difference
  {id:  0, min: 650, max: 2550, invert: false }, // Servo 1
  {id:  1, min: 700, max: 2600, invert: false }, // Servo 2
  {id:  2, min: 550, max: 2450, invert: false }, // Servo 3
  {id:  3, min: 700, max: 2600, invert: true  }, // Servo 4 
  {id:  4, min: 700, max: 2600, invert: false }, // Servo 5
  {id:  5, min: 700, max: 2600, invert: true  }, // Servo 6
  {id:  6, min: 700, max: 2600, invert: true  }, // Servo 7
  {id:  7, min: 500, max: 2400, invert: true  }, // Servo 8  
  {id:  8, min: 700, max: 2600, invert: true  }, // Servo 9   
  {id:  9, min: 800, max: 2700, invert: false }, // Servo 10
  {id: 10, min: 700, max: 2600, invert: true  }, // Servo 11
  {id: 11, min: 700, max: 2600, invert: false }  // Servo 12    
];

const walkState = {
  walkStates: [{"name":"Base","angles":[90,0,90,0,90,0,90,0,90,0,90,0]},{"name":"Step 1","angles":[90,0,90,60,90,0,90,60,90,0,90,60]},{"name":"Step 2","angles":[90,0,60,60,90,0,60,60,90,0,60,60]},{"name":"Step 3","angles":[90,0,60,0,90,0,60,0,90,0,60,0]},{"name":"Step 4","angles":[90,60,60,0,90,60,60,0,90,60,60,0]},{"name":"Step 5","angles":[90,60,90,0,90,60,90,0,90,60,90,0]},{"name":"Step 6","angles":[60,60,90,0,60,60,90,0,60,60,90,0]},{"name":"Step 7","angles":[60,0,90,0,60,0,90,0,60,0,90,0]},{"name":"Step 8","angles":[60,0,90,60,60,0,90,60,60,0,90,60]},
                    {"name": "end"}],
  index:0,
  walkTimerId: null
};

const MAX_SERVOS = 12;



/**
 * An array of Servo objects, one for each of the possible servos
 * that can be controlled.
 */
var servos = [];

//
// Class: Servo
//
class Servo {

  
  constructor(id, min, max, invert) {
    if (id < 0 || id >= MAX_SERVOS) {
      console.log("Error: id out of range, supplied was %d", id);
    }
    this.id  = id;
    this.min = min;
    this.max = max;
    this.invert = invert;
  }
  
  static map( x,  in_min,  in_max,  out_min,  out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }
  
  set angle(angle) {
    if (angle < 0 || angle > 180) {
      console.log("Error: Angle set to %d", angle);
      return;
    }

    this._angle = angle;
    console.log("Setting driver %d to angle %d", this.id, this._angle);
    Servo.pca9685Driver.setPulseLength(this.id, Servo.map(this.invert?180-this._angle:this._angle, 0, 180, this.min, this.max));
  }
  
  get angle() {
    return this._angle;
  }
  
  static set pca9685Driver(driver) {
    console.log("Driver set! to " + driver);
    this._driver = driver;
  }
  
  static get pca9685Driver() {
    return this._driver;
  }
}; // End of class Servo


/**
 * Initialize the PWM controller.
 */
function init() {
  // Sanity checks
  assert(MAX_SERVOS == servoInits.length, "Mismatch in number of servos and number of servo inits");
  
  let Pca9685Driver = require("pca9685").Pca9685Driver;
  let i2cBus        = require("i2c-bus");

  let options = {
      "i2c":        i2cBus.openSync(1),
      "address":    0x40,
      "frequency":  50,
      "debug":      false
  };
  
  let driver = new Pca9685Driver(options, ()=>{
    console.log("Initialization done");
    Servo.pca9685Driver = driver;
    for (let i=0; i<MAX_SERVOS; i++) {
      let servoInitData = servoInits[i];
      assert(servoInitData.id == i, "Error found matching servo init data");
      let servo = new Servo(servoInitData.id, servoInitData.min, servoInitData.max, servoInitData.invert);
      servo.angle = 90;
      servos[i] = servo;
    }
  });
} // End of init


/**
 * Set the specific servo to the desired angle.
 * @function
 * @param id The id of the servo.  A value between 0 and MAX_SERVOS-1.
 * @param angle The angle to set the servo.
 */
function setServo(id, angle) {
  assert(id >=0 && id < MAX_SERVOS);
  assert(angle >= 0 && angle <=180);
  servos[id].angle = angle;
}; // End of serServo



// Initialize the environment
init();
var server = require("http").createServer();
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({server: server});
wss.on("connection", (ws)=> {
  console.log("Received a new ws connection");
  ws.on("message", function(message) {
    console.log("Received a new message: %s", message);
    processCommand(JSON.parse(message));
  });
});

server.listen(3000, ()=> {
  console.log("Server listening on port 3000");
});


/**
 * Process a command received over the Web Socket.
 * @param command The command to be processed.  The types supported are:
 * <ul>
 * <li>state - receive a complete set of servo states</li>
 * </ul>
 */
function processCommand(command) {
  switch(command.type) {
  case "state":
    assert(command.data.angles.length == MAX_SERVOS);
    for (let servoId=0; servoId<MAX_SERVOS; servoId++) {
      setServo(servoId, command.data.angles[servoId]);
    }
    break;

  case "walk":
    if (walkState.timerId != null) {
      clearInterval(walkState.timerId);
    }
    walkState.index = 0;
    walkState.timerId = setInterval(walk, 200);
    break;

  case "stop":
    if (walkState.timerId != null) {
      clearInterval(walkState.timerId);
      walkState.timerId = null;
    }
    break;

  default:
    console.log("Unknown command type: %s", command.type);
    break;
  }
} // End of processCommand


setTimeout(()=> {
  console.log("Time out!");
}, 1000*60*60);


function walk() {
  if (walkState.walkStates[walkState.index].name == "end") {
    walkState.index = 1;
  }
  
  console.log("***********\nWalking state: %d", walkState.index);
  for (let servoId=0; servoId<MAX_SERVOS; servoId++) {
    setServo(servoId, walkState.walkStates[walkState.index].angles[servoId])
  }
  walkState.index++;
}