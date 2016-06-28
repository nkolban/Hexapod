/**
 * Control a hexapod robot.
 * 
 * Author: Neil Kolban, kolban1@kolban.com
 * Date: 2016-06-21
 */

"use strict";
const assert = require("assert");

// 0   = forward facing/down
// 180 = backward facing/up

// Servo data
// min, max - the minimum and maximum movement values
// invert - Should the angle be inverted 0->180 and 180->0
// servoId
const servoInits = [
  {id:  0, min: 700, max: 2600, invert: false },
  {id:  1, min: 700, max: 2600, invert: false },
  {id:  2, min: 700, max: 2600, invert: false },
  {id:  3, min: 700, max: 2600, invert: true },      
  {id:  4, min: 700, max: 2600, invert: false },
  {id:  5, min: 700, max: 2600, invert: true },
  {id:  6, min: 700, max: 2600, invert: true },
  {id:  7, min: 700, max: 2600, invert: true },  
  {id:  8, min: 700, max: 2600, invert: true },   
  {id:  9, min: 700, max: 2600, invert: false },
  {id: 10, min: 700, max: 2600, invert: true },
  {id: 11, min: 700, max: 2600, invert: false }    
];
const MAX_SERVOS = 12;
var servos = [];

//
// Class: Servo
//
class Servo {

  
  constructor(id, min, max, invert) {
    if (id < 0 || id > 15) {
      console.log("Error: id out of range, supplied was %d", id);
    }
    this.id = id;
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


//
// init
//
function init() {
  // Sanity checks
  assert(MAX_SERVOS == servoInits.length, "Mismatch in number of servos and number of servo inits");
  
  let Pca9685Driver = require("pca9685").Pca9685Driver;
  let i2cBus        = require("i2c-bus");

  let options = {
      "i2c":        i2cBus.openSync(1),
      "address":    0x40,
      "frequency":  50,
      "debug":      true
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


function setServo(id, angle) {
  servos[id].angle = angle;
};



// Initialize the environment
init();
var server = require("http").createServer();
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({server: server});
wss.on("connection", (ws)=> {
  console.log("Received a new ws connection");
  ws.on("message", function(message) {
    console.log("Received a new message: %s", message);
    let command = JSON.parse(message);
    debugger;
    setServo(command.servoId, command.value);
  });
});
server.listen(3000, ()=> {
  console.log("Server listening on port 3000");
});


setTimeout(()=> {
  console.log("Time out!");
}, 1000*60*60);

