/**
 * hexapod_browser
 * 
 * This application shows a hexapod control panel to the end user.  It forms
 * a Web Socket connection to the Pi which is listening at port 3000.
 * Commands sent are JSON strings of the format:
 * 
 * {
 *   servoId: <servoId>
 *   value: <value>
 * }
 * 
 * The servoId is a number between 0 and 11.
 * 
 * The servos are:
 *          +-----+
 *     [-]0 |     |  6[-]
 * 1 [|]    |     |     [|] 7
 *          |     |
 *     [-]2 |     |  8[-]
 * 3 [|]    |     |     [|] 9
 *          |     |
 *     [-]4 |     | 10[-]
 * 5 [|]    |     |     [|] 11
 *          +-----+
 * 
 */
$(function(){
  var servos = {};

  function makeKnob(parms) {
    var ret= {
      width: 150,
      height: 150,
      min: 0, max: 180,
      angleArc: 180,
      release: function(value) {
        // Lookup the servo for this knob and call its setAngle function
        servos[this.$.attr('id')].setAngle(value);
      }
    };
    $.each(parms, (param, value) => {
      ret[param] = value;
    });
    return ret;
  }
  
  $("#servo1").knob(makeKnob({
    angleOffset: -90
  }));
  
  $("#servo2").knob(makeKnob({
    angleOffset: 180,
    rotation: "clockwise"
  }));
  
  $("#servo7").knob(makeKnob({
    angleOffset: -90,
  }));
  
  $("#servo8").knob(makeKnob({
    angleOffset: 0,
    rotation: "anticlockwise"
  }));
  
// --------------------------------------------------------------

  $("#servo3").knob(makeKnob({
    angleOffset: -90,
  }));
  
  $("#servo4").knob(makeKnob({
    angleOffset: 180,
    rotation: "clockwise"
  }));
  
  $("#servo9").knob(makeKnob({
    angleOffset: -90,
  }));
  
  $("#servo10").knob(makeKnob({
    angleArc: 180,
    angleOffset: 0,
    rotation: "anticlockwise"
  }));
  
// --------------------------------------------------------------  
  $("#servo5").knob(makeKnob({
    angleOffset: -90,
  }));
  
  $("#servo6").knob(makeKnob({
    angleOffset: 180,
    rotation: "clockwise"
  }));
  
    $("#servo11").knob(makeKnob({
    angleOffset: -90,
  }));
  
  $("#servo12").knob(makeKnob({
    angleOffset: 0,
    rotation: "anticlockwise"
  }));    
  
  
  const MAX_SERVOS = 12;
  // Init the servos
  for (let i=1; i<=MAX_SERVOS; i++) {
    servos["servo"+i] = {
      angle: 90,
      servoId: i,
      setAngle: function(angle) {
        console.log("Servo: " + this.servoId + ", angle=" + angle);
        this.angle = angle;
        $("#servo" + this.servoId).val(angle);
      }
    };
  }
  
  let slidersArray = [];
  // Create the visual sliders ...
  for (let i=0; i<MAX_SERVOS; i++) {
    let parent = $("<div>").css({"border": "1px solid", "margin-bottom": "5px", "padding": "5px"});
    parent.append($("<span>").text("Servo: " + (i+1) + " "));
    let sp = $("<span>").text(90);
    parent.append(sp);
    let slider = $("<div>").slider({
      "min":    0,
      "max":    180,
      "step":   5,
      "value":  90,
      "change": function(event, ui) {
        let value = ui.value;
        let servoId = $(this).data("id");
        console.log("Servo: %s -> %d", $(this).data("id"), ui.value);
        $(this).data("sp").text(String(ui.value));
        visualizeServo(servoId, value);
        ws.send(JSON.stringify({servoId: servoId, value: value}));
      }
    }).css({"margin-top": "20px"}).data("id", i).data("sp", sp);

    slidersArray[i] = slider;
    parent.append(slider);
    $("#servos").append(parent);
  }
  
  
  // Servos are:
  //   +--+
  // 0 |  | 3
  // 1 |  | 4
  // 2 |  | 5
  //   +--+
  var servoGuis = [];
  // A Servi Gui object will contain:
  // Leg
  // HorizServo
  // VertServo
  // function setHorizAngle()
  // function setLegAngle()
  

  
  function sendFromArray(array) {
    for (let i=0; i<array.length; i+=2) {
      let id = array[i];
      let value = array[i+1];
      ws.send(JSON.stringify({servoId: (id-1), value: value}));
      slidersArray[id-1].slider("option", "value", value);
    }
  }
  

  $("#resetButton").button().click(()=>{
    let array = [1,90, 2,10, 3,90, 4,10, 5,90, 6,10, 7,90, 8,10, 9,90, 10,10, 11,90, 12,10];    
    sendFromArray(array);
  });
  
  $("#setAllButton").button().click(()=>{
    let value = $("#setAllNumberInput").val();
    for (let i=0; i<MAX_SERVOS; i++) {
      ws.send(JSON.stringify({servoId: i, value: value}));
    } 
  });
  

  $("#phase1Button").button().click(()=>{
    let array = [2,90, 6,90, 10,90];
    sendFromArray(array);
  });
  

  $("#phase2Button").button().click(()=>{
    let array = [1,45, 5,45, 9,45];
    sendFromArray(array);
  });
  

  $("#phase3Button").button().click(()=>{
    let array = [2,10, 6,10, 10,10];    
    sendFromArray(array);
  });
  
  $("#phase4Button").button().click(()=>{
    let array = [4,90, 8,90, 12,90];    
    sendFromArray(array);
  });
  
  $("#phase5Button").button().click(()=>{
    let array = [1,90, 5,90, 9,90];    
    sendFromArray(array);
  });
  
  $("#setAllNumberInput").val(90);
  
  function wsConnect() {
    ws = new WebSocket("ws://pizero:3000");
    ws.onopen = function() {
      console.log("Connect to pizero");
    };
  }
  
  $("#wsReconnect").button().click(()=>{
    wsConnect();
  });
  wsConnect();
  
  // Setup three.js
  //debugger;
  let scene = new THREE.Scene();
  let width=$("#scene").width();
  let height=$("#scene").height();
  let camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  $("#scene").append(renderer.domElement);
  
  var controls = new THREE.TrackballControls(camera, $("#scene").get(0));
  controls.rotateSpeed = 2.0;
  controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.keys = [ 65, 83, 68 ];
	controls.addEventListener( 'change', render );
  
  var ambientLight = new THREE.AmbientLight(0xf0f0f0);
  scene.add(ambientLight);
  
  /*
  var cubeGeometry = new THREE.CubeGeometry(1,1,1);
  var cubeMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: false});
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  scene.add(cube);
  */
  camera.position.z = 30;
  renderer.setClearColor(0xF0F0F0);
  
  scene.add(new THREE.AxisHelper(3));

  function setBAngle(angle) {
    if (this.BInvert == true) {
      angle = -angle;
    }
    this.B.rotation.y = angle * Math.PI / 180;
  }
  
  function setLAngle(angle) {
    this.L.rotation.z = angle * Math.PI / 180;
  }

  var models = {
    toLoad:3,
    loaded: function() {

      models.B.position.x = -0.36;
      models.B.position.y = 3.10;
      
      models.L.position.x = 5.2;
      models.L.position.y = -0.9;
      models.L.position.z = -2.25;
      models.B.add(models.L);
      //scene.add(models.Leg);
      models.A.add(models.B);
      
      
      var clone = models.A.clone();
      var m = {
        A: clone,
        B: clone.getObjectByName("B"),
        L: clone.getObjectByName("L"),
        setBAngle: setBAngle,
        setLAngle: setLAngle
        
      }
      m.A.position.x = 0;
      scene.add(m.A);
      servoGuis.push(m);
      
      var clone = models.A.clone();
      m = {
        A: clone,
        B: clone.getObjectByName("B"),
        L: clone.getObjectByName("L"),
        setBAngle: setBAngle,
        setLAngle: setLAngle
      }
      m.A.position.x = 8;
      scene.add(m.A);
      servoGuis.push(m);
      
      var clone = models.A.clone();
      m = {
        A: clone,
        B: clone.getObjectByName("B"),
        L: clone.getObjectByName("L"),
        setBAngle: setBAngle,
        setLAngle: setLAngle
      }
      m.A.position.x = 16;
      scene.add(m.A);
      servoGuis.push(m);
      
      models.B2.position.x = -0.36;
      models.B2.position.y = 3.10;
      
      models.L.position.x = 5.2;
      models.L.position.y = -0.9;
      models.L.position.z = 2.25;
      models.B2.add(models.L);
      //scene.add(models.Leg);
      models.A.remove(models.B);
      models.A.add(models.B2);
      
      
      var clone = models.A.clone();
      var m = {
        A: clone,
        B: clone.getObjectByName("B2"),
        L: clone.getObjectByName("L"),
        BInvert: true,
        setBAngle: setBAngle,
        setLAngle: setLAngle
      }
      m.A.position.z = 8;
      scene.add(m.A);
      servoGuis.push(m);
      
      var clone = models.A.clone();
      var m = {
        A: clone,
        B: clone.getObjectByName("B2"),
        L: clone.getObjectByName("L"),
        BInvert: true,        
        setBAngle: setBAngle,
        setLAngle: setLAngle       
      }
      m.A.position.z = 8;
      m.A.position.x = 8;
      scene.add(m.A);
      servoGuis.push(m);
      
      var clone = models.A.clone();
      var m = {
        A: clone,
        B: clone.getObjectByName("B2"),
        L: clone.getObjectByName("L"),
        BInvert: true,        
        setBAngle: setBAngle,
        setLAngle: setLAngle 
      }
      m.A.position.z = 8;
      m.A.position.x = 16;      
      scene.add(m.A);
      servoGuis.push(m);
      
      render();
    }
  };
  models.toLoad = 4;

  
  loadJSON("Leg",        "L");
  loadJSON("HorizServo", "A");
  loadJSON("VertServo",  "B");
  loadJSON("VertServo2", "B2");  
  
  function loadJSON(fileName, objectName) {
    var loader = new THREE.JSONLoader();
    loader.load("models/"+fileName+".json", (geometry, materials) => {
      var object = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
      object.name = objectName;
      models[objectName] = object;
      models.toLoad--;
      if (models.toLoad == 0) {
        models.loaded();
      }
    });
  } // End of loadJSON
  
  
  function render() {
    renderer.render( scene, camera );
  }
  
  function animate() {
				requestAnimationFrame(animate);
				controls.update();
  }
  animate();
  
  var a = 90;
  var i=0.5;
  setInterval(()=>{
    //return;
    //return;
    a = a + i;
    if (a > 160) {
      i=-i;
    }
    if (a < 20) {
      i=-i;
    }
    $.each(servoGuis, (index, value) => {
      //value.VertServo.rotation.y = a * Math.PI / 180;
      value.setBAngle(a);
      value.setLAngle(a);
      //value.L.rotation.z = a * Math.PI / 180;
    });
    render();
  }, 10);
  
  function dumpObject(object) {
    console.log("Name: %s", object.name);
  }
  
  /**
   * Visualize the position of a servo.  The servo id is between 0 and 11
   * and the angle is between 0 and 180
   */
  function visualizeServo(servoId, angle) {
    /**
     * The algorithm will be as follows.  First we find the servoGUI object that
     * corresponds with the servo selected.  There are 6 servoGUI objects.  To
     * find the corresponding servoGUI we map as follows:
     * 
     * servo  servoGUI
     * 0    - 0
     * 1    - 0
     * 2    - 1
     * 3    - 1
     * 4    - 2 
     * 5    - 2
     * 6    - 3
     * 7    - 3 
     * 8    - 4
     * 9    - 4
     * 10   - 5 
     * 11   - 5
     * 
     * We see that the algorithm for this is Math.floor(servoId/2)
     * Now, if the servoId is even then it is a B servo rotate if it is
     * odd then it is an L (leg) object rotate.
     */
     let servoGuiIndex = Math.floor(servoId/2);
     let servoGui = servoGuis[servoGuiIndex];
     if (servoId%2 == 0) {
       servoGui.setBAngle(angle);
     } else {
       servoGui.setLAngle(angle);
     }
     render();
  } // End of visualizeServo
});
