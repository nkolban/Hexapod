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
 * 
 * The servos object has a property for each servo ... servo1, ... servo12.
 * 
 * Each property object contains:
 * {
 *   servoId:   <servoId (1-12)>
 *   angle:     <current angle>
 *   setAngle:  function(angle)
 *   getAngle:  function()
 *   showAngle: function(angle)
 * }
 * 
 */
$(function(){
  var servos = {};
  
  // An array of saved states.  Each state is composed of:
  // {
  //   name: <The name of the state>,
  //   angles: [... an array of angles, one per servo ]
  // }
  var savedStates;
  loadStates();
  
  // Background color of the the 3D scene
  const BACKGROUND_COLOR=0xFFFFFF;  // White
  
  // Number of servos
  const MAX_SERVOS = 12;

  function makeKnob(parms) {
    var ret= {
      "width":    75,
      "height":   75,
      "min":      0,
      "max":      180,
      "angleArc": 180,
      "fgColor":  "#0066cc",
      "release":  function(value) {
        // Lookup the servo for this knob and call its setAngle function
        servos[this.$.attr('id')].setAngle(value);
      },
      "change": function(value) {
        servos[this.$.attr('id')].showAngle(value);
      }
    };
    $.each(parms, (param, value) => {
      ret[param] = value;
    });
    return ret;
  } // End of makeKnob
  
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
  
  
  // Init the servos
  for (let i=1; i<=MAX_SERVOS; i++) {
    servos["servo"+i] = {
      "angle":   -1,
      "servoId": i,
      "setAngle": function(angle) {
        if (this.getAngle() == angle) {
          return;
        }
        console.log("Servo: " + this.servoId + ", angle=" + angle);
        this.angle = angle;
        $("#servo" + this.servoId).val(angle).trigger("change");
        this.showAngle(angle);
      },
      "showAngle": function(angle) {
        visualizeServo(this.servoId-1, angle);
      },
      "getAngle": function() {
        return this.angle;
      }
    };
  } // End of servo initialization
  
  // Helper to get the specified servo ... id = 1 to MAX_SERVOS
  function getServo(servoId) {
    return servos["servo"+servoId];
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
  

  function wsConnect() {
    ws = new WebSocket("ws://pizero:3000");
    ws.onopen = function() {
      console.log("Connect to pizero");
    };
  }
  
  function loadStates() {
    savedStates = JSON.parse(localStorage.getItem("savedStates"));
    if (savedStates === null) {
      savedStates = [];
    }
  }
  
  function saveStates() {
    localStorage.setItem("savedStates", JSON.stringify(savedStates));
  }

  
  $("#wsReconnect").button().click(()=>{
    wsConnect();
  });
  
  function resetServos() {
    $.each(servos, (param, value) => {
      value.setAngle(90);
    });
  }
  
  $("#resetButton").button().click(()=>{
    resetServos();
  });
  
  $("#stateDialog").dialog({
    "title":    "State",
    "modal":    true,
    "width":    600,
    "autoOpen": false,
    "buttons":  [
    {
      text: "Export",
      click: function() {
        $("#exportStatesTextArea").val(JSON.stringify(savedStates));
        $("#exportStatesDialog").dialog("open");
      }
    },
    {
      text: "Apply",
      click: function() {
        let state = JSON.parse($("#stateTextArea").val());
        useState(state);
      }
    },
    {
      text: "Save",
      click: function() {
        $("#stateNameDialog").dialog("open");
      }
    },
    {
      text: "Close",
      click: function() {
        saveStates();
        $(this).dialog("close");
      }
    }
    ]
  });
  
  
  $("#statesList").sortable({
    "update": function(event, ui) {
      let a = $(this).sortable("toArray");
      var newArray = [];
      $.each(a, (index, name) => {
        // sortable_
        // 0123456789
        name = name.substring(9);
        newArray.push(findStateByName(name).state);
      });
      savedStates = newArray;
    }
  });
  
  
  function buildStateFromKnobs() {
    var result = {
      name: "XXX",
      angles: []
    };
    for (let i=1; i<=MAX_SERVOS; i++) {
      let currentServo = servos["servo"+i];
      result.angles.push(currentServo.getAngle());
    }
    return result;
  } // End of buildStateFromKnobs
  
  
  $("#statesButton").button().click(()=>{
    let currentState = buildStateFromKnobs();
    $("#stateTextArea").val(JSON.stringify(currentState));
    refreshStatesList();
    $("#stateDialog").dialog("open");
  });
  
  $("#stateNameDialog").dialog({
    title: "State name",
    "modal":    true,
    "width":    400,
    "autoOpen": false,
    "buttons": [
    {
      text: "Close",
      click: function() {
        // Add the new state here ...
        let currentState = buildStateFromKnobs();
        currentState.name = $("#stateNameText").val().trim();
        addSavedState(currentState);
        refreshStatesList();
        $(this).dialog("close");
      }
    }
    ]
  });
 
  $("#exportStatesDialog").dialog({
    title: "Export states",
    "modal":    true,
    "width":    600,
    "autoOpen": false,
    "buttons": [
    {
      text: "Close",
      click: function() {
        $(this).dialog("close");
      }
    }
    ]
  });
  
  /**
   * Build an HTML DOM fragment for showing this specific state.
   */
  function buildHTMLFromState(state) {
    let parent = $("<div>");
    let name = $("<span>").css({"display": "inline-block", "width": "300px"}).text(state.name);
    parent.append(name);
    let useButton = $("<button>").text("Use").button().click($.proxy(function() {
      console.log("Using state: " + JSON.stringify(this));
      useState(this);
    }, state));
    parent.append(useButton);
    let deleteButton = $("<button>").text("Delete").button().click($.proxy(function() {
      deleteState(state.name);
    }, state));
    parent.append(deleteButton);
    return parent;
  } // End of buildHTMLFromState
  
  
  function refreshStatesList() {
    let container = $("#statesList");
    container.empty();
    $.each(savedStates, (index, currentState) => {
      let li = $("<li>").attr("id", "sortable_" + currentState.name);
      li.append(buildHTMLFromState(currentState));
      container.append(li);
    });
  } // End of refreshStatesList
  
  
  function useState(state) {
    // Set the servos from the array data ...
    for (let i=1; i<=MAX_SERVOS; i++) {
      getServo(i).setAngle(state.angles[i-1]);
    }
    $("#stateTextArea").val(JSON.stringify(state));
  } // End of useState
  
  function deleteState(name) {
    let foundState = findStateByName(name);
    if (foundState == null) {
      return;
    }
    savedStates.splice(foundState.index, 1);
    refreshStatesList();
  }

  
  /**
   * Find a saved state by a given name.  If none exists with that name
   * then we return null.  Otherwise we return an object that is:
   * {
   *   index: <The index in the array that corresponds to the state>
   *   state: <The value of the state data>
   * }
   */
  function findStateByName(name) {
    let foundState = null;
    let foundIndex = 0;
    $.each(savedStates, (index, value) => {
      if (name == value.name) {
        foundState = value;
        foundIndex = index;
        return false;
      }
    }); // End of each saved state
    
    if (foundState == null) {
      return null;
    }
    
    return {
      "index": foundIndex,
      "state": foundState
    };
  } // End of findStateByName

  
  /**
   * Add a state to the list of saved states.  If a state with the same name
   * already exists, then we replace that state data.
   */
  function addSavedState(state) {
    let existingState = findStateByName(state.name);
    if (existingState === null) {
      savedStates.push(state);
    } else {
      savedStates[existingState.index] = state;
    }
  } // End of addState
  
  wsConnect();
  
  //
  // Setup three.js
  //
  let scene = new THREE.Scene();
  let width=$("#scene").width();
  let height=$("#scene").height();
  
  let camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
  camera.position.set(8,20,50);
  scene.add(camera);
  
  var renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(width, height);
  renderer.setClearColor(BACKGROUND_COLOR);
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
  controls.target = new THREE.Vector3(8,0,4);
	controls.addEventListener( 'change', render );
  
  var ambientLight = new THREE.AmbientLight(0xf0f0f0);
  scene.add(ambientLight);
  
  
  let axisHelper = new THREE.AxisHelper(3);
  axisHelper.position.set(8,0,4);
  scene.add(axisHelper);
  
  function toRadians(angle) {
    return angle * Math.PI / 180;
  }

  function setBAngle(angle) {
    angle = 180 - angle;
    if (this.BInvert == true) {
      angle = -angle;
    }
    this.B.rotation.y = toRadians(angle);
  }
  
  function setLAngle(angle) {
    this.L.rotation.z = toRadians(angle);
  }

  var models = {
    loaded: function() {
  // Servos are:
  //   +--+
  // 0 |  | 3
  // 1 |  | 4
  // 2 |  | 5
  //   +--+
      models.B.position.x = -0.36;
      models.B.position.y = 3.10;
      
      models.L.position.x = 5.2;
      models.L.position.y = -0.9;
      models.L.position.z = -2.25;
      models.B.add(models.L);
      //scene.add(models.Leg);
      models.A.add(models.B);
      
      // 3
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
      servoGuis[3] = m;
      
      // 4
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
      servoGuis[4] = m;
      
      // 5
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
      servoGuis[5] = m;
      
      models.B2.position.x = -0.36;
      models.B2.position.y = 3.10;
      
      models.L.position.x = 5.2;
      models.L.position.y = -0.9;
      models.L.position.z = 2.25;
      models.B2.add(models.L);
      //scene.add(models.Leg);
      models.A.remove(models.B);
      models.A.add(models.B2);
      
      // 0
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
      servoGuis[0] = m;      
      
      // 1
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
      servoGuis[1] = m; 
      
      // 2
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
      servoGuis[2] = m; 
      
      render();
    }
  };
  
  // Load the modeled parts of our story.
  loadJSON([
    {"fileName": "Leg",        "objectName": "L"},
    {"fileName": "HorizServo", "objectName": "A"},
    {"fileName": "VertServo",  "objectName": "B"},
    {"fileName": "VertServo2", "objectName": "B2"}
  ]);
  
  function loadJSON(objectsToLoad) {
    let loader = new THREE.JSONLoader();
    let count = objectsToLoad.length;
    $.each(objectsToLoad, (index, value) => {
      loader.load("models/"+value.fileName+".json", (geometry, materials) => {
        let object = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
        object.name = value.objectName;
        models[object.name] = object;
        count--;
        if (count == 0) {
          models.loaded();
          resetServos();
        }
      });
    }); // End of for each object to load ...
    
  } // End of loadJSON
  
  
  function render() {
    renderer.render( scene, camera );
  }
  
  function animate() {
				requestAnimationFrame(animate);
				controls.update();
  }
  animate();
  
  
  function syncServos() {
    $.each(servos, (parameter, currentServo) => {
      currentServo.showAngle(currentServo.angle);
    });
  }
  
  /**
   * Visualize the position of a servo by updating the 3D model.  The servo id is between 0 and 11
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
     let servoGui = servoGuis[Math.floor(servoId/2)];
     if (servoId%2 == 0) {
       servoGui.setBAngle(angle);
     } else {
       servoGui.setLAngle(angle);
     }
     render();
  } // End of visualizeServo
});
