VRUserInput = {};
(function (VRUserInput) {
	
	PositionSensor = null;
	state = null;
	
	VRUserInput.connectTo = function(sceneModel, domElement) {
		
		state = sceneModel.state;
		checkVRSupport(
			function(devices) {
				PositionSensor = getFirstPositionSensorDevice(devices);
				if(PositionSensor) positionSensorLoop();
			}
		);
		
		// Keyboard events
		domElement.onkeypress = function(e) {
			e = e || window.event;
			var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
			if (charCode) state.inputDevices.local.keyboard.keysPressed.push(charCode);
		};
		
		// Mouse events
		domElement.addEventListener("mousedown", function() {
			state.inputDevices.local.mouse.buttonDown = true;
		});
		domElement.addEventListener("mouseup", function() {
			state.inputDevices.local.mouse.buttonDown = false;
		});
		
	}
	
	var positionSensorLoop = function() {
		var hmdState = PositionSensor.getState();
		if(hmdState.hasPosition) {
			state.inputDevices.local.HMDs[0] = 
				{ 
					x : hmdState.orientation.x,
					y : hmdState.orientation.y,
					z : hmdState.orientation.z,
					w : hmdState.orientation.w
				};
		}
		requestAnimationFrame(positionSensorLoop);
	}
	
	var resetPositionSensor = function() {
		if(PositionSensor) PositionSensor.zeroSensor();	
	}
	
	var getFirstPositionSensorDevice = function(devices) {
		for ( var i = 0; i < devices.length; i ++ ) {
			var device = devices[ i ];
			if ( device instanceof PositionSensorVRDevice ) {
				return devices[ i ]; // We keep the first we encounter
			}
		}
		error('PositionSensor is not available');
	}
	
	var checkVRSupport = function(onSuccess) {
		if ( navigator.getVRDevices !== undefined ) {
			navigator.getVRDevices().then( onSuccess );
		} else {
			error( 'Your browser is not VR Ready' );
		}
	}
	
	var error = function(message) {
		console.log(message);
		// TODO: What to do if VR not supported?
	}
	
}(VRUserInput));

