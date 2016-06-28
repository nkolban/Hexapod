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
 *           +-----+
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
  const MAX_SERVOS = 12;
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
        ws.send(JSON.stringify({servoId: servoId, value: value}));
      }
    }).css({"margin-top": "20px"}).data("id", i).data("sp", sp);

    slidersArray[i] = slider;
    parent.append(slider);
    $("#servos").append(parent);
  }
  

  
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
  
  var controls = new THREE.TrackballControls( camera );
  controls.rotateSpeed = 1.0;
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


  let loader = new THREE.ColladaLoader();
  var horizServo;
  var vertServo;
  var leg;
  loader.load('hexapod.dae', 
     (collada)=>{
        // Complete
        $.each(collada.scene.children, (index, value) => {
          if (value.name == "VertServo") {
            vertServo = value;
          }
          if (value.name == "Leg") {
            leg = value;
          }
          if (value.name == "HorizServo") {
            horizServo = value;
          }
        });
        scene.add(horizServo);
        scene.add(vertServo);
        scene.add(leg);
        initPositions();
        render();
     },
     (xhr)=>{
        // Progress
     }
  );
  
  loader = new THREE.ObjectLoader();
  loader.load("1.json", (object) => {
   debugger;
  });
  
  function initPositions() {
    var horizServo2 = horizServo.clone();
    scene.add(horizServo2);
  }
  
  function render() {
    renderer.render( scene, camera );
  }
  
  function animate() {
				requestAnimationFrame(animate);
				controls.update();
  }
  animate();
});
