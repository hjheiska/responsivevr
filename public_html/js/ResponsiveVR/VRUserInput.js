VRUserInput = {};
(function (VRUserInput) {
	
	navigator.getUserMedia = 
		navigator.getUserMedia || 
		navigator.mozGetUserMedia || 
		navigator.webkitGetUserMedia || 
		navigator.msGetUserMedia;
	var URL = window.URL || window.webkitURL;
	var createObjectURL = URL.createObjectURL || webkitURL.createObjectURL;
		
	PositionSensor = null;
	state = null;
	
	ARTracker = null;
	ARCanvas = null;
	ARRaster = null;
	ARVideo = null;
	ARResultMat = null;
	ARTmp = new Float32Array(16);
	ARParams = null;
	
	videoWidth = 640;
	videoHeight = 480;
	
	VRUserInput.connectTo = function(sceneModel, domElement) {
		
		state = sceneModel.state;
		
		if(!PositionSensor) {
			checkVRSupport(
				function(devices) {
					PositionSensor = getFirstPositionSensorDevice(devices);
					if(PositionSensor) positionSensorLoop();
				}
			);
		}

		if(ARParams == null) {
			getQRTracking(
				function(success) {
					if(success) qrTrackerLoop();
				}
			);
		}
		else {
			state.inputDevices.local.webcamCameraParams = ARParams;
			state.inputDevices.local.webCameraImage = ARCanvas;
		}
		
		
		// Keyboard events
		domElement.onkeypress = function(e) {
			e = e || window.event;
			var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
			if (charCode) 
				state.inputDevices.local.keyboard.keysPressed.push(charCode);
		};
		
		// Mouse events
		domElement.addEventListener("mousedown", function() {
			state.inputDevices.local.mouse.buttonDown = true;
		});
		domElement.addEventListener("mouseup", function() {
			state.inputDevices.local.mouse.buttonUp = false;
		});
		
	}
	var threshold = 0;
	var qrTrackerLoop = function() {
		
		ARCanvas.getContext('2d').drawImage(ARVideo, 0,0); 
		ARCanvas.changed = true;
		
		var detected = ARTracker.detectMarkerLite(ARRaster, threshold);
		// Scan through threshold settings to adapt to lightning conditions
		if(detected == 0) threshold += 5;
		if(threshold > 250) threshold = 0;
		// Detect the markers in the video frame.
		var detectedMarkers = [];
		for (var i=0; i<detected; i++) {
			// Get the marker matrix into the result matrix.
			ARTracker.getTransformMatrix(i, ARResultMat);
			// Copy the marker matrix to the tmp matrix.
			copyMarkerMatrix(ARResultMat, ARTmp);
			// Copy the marker matrix over to your marker root object.
			var glMatrix =  getGLMatrix(ARTmp); 
			detectedMarkers.push(glMatrix);	
		}
		//if(detectedMarkers.length > 0) console.log(detectedMarkers.length);
		state.inputDevices.local.qrTrackers = detectedMarkers;
		
		requestAnimationFrame(qrTrackerLoop);
	}
	
	
	var positionSensorLoop = function() {
		var hmdState = PositionSensor.getState();
		
		state.inputDevices.local.HMDs[0] = 
			{ 
				x : hmdState.orientation.x,
				y : hmdState.orientation.y,
				z : hmdState.orientation.z,
				w : hmdState.orientation.w
			};
		
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
		console.log('PositionSensor is not available');
	}
	
	var checkVRSupport = function(onSuccess) {
		if (navigator.getVRDevices) {
			navigator.getVRDevices().then( onSuccess );
		}
		else if(navigator.mozGetVRDevices) {
			navigator.mozGetVRDevices(onSuccess);
		} else {
			console.log( 'Your browser is not VR Ready');
		}
	}
	
	var getQRTracking = function(callback) {
		DEBUG = false;
		ARVideo = document.createElement('video');
		// ARVideo.width = 640;
		// ARVideo.height = 480;
		ARVideo.width = videoWidth;
		ARVideo.height = videoHeight;
		// var aspectRatio = (864 / 480)
		ARVideo.loop = true;
		ARVideo.autoplay = true;
		ARVideo.volume = 0;
		ARVideo.controls = true;
		navigator.getUserMedia({'video': true},
		  function(stream) {
				var url = createObjectURL(stream);
				ARVideo.src = url;
				document.body.appendChild(ARVideo);
				ARVideo.style.display = "none";
				ARCanvas = document.createElement('canvas'); // canvas to draw our video on
				ARCanvas.width =  ARVideo.height;
				ARCanvas.height = ARVideo.width;
				ARCanvas.getContext('2d').translate(
					ARCanvas.width * 0.5, 
					ARCanvas.height * 0.5
				);
				ARCanvas.getContext('2d').rotate(Math.PI/2);
				ARCanvas.getContext('2d').translate(
					-ARCanvas.height * 0.5,
					-ARCanvas.width * 0.5
				);
				
				if(DEBUG) {
					document.body.appendChild(ARCanvas);
					var debugCanvas = document.createElement('canvas');
					debugCanvas.id = 'debugCanvas';
					debugCanvas.width = ARVideo.height;
					debugCanvas.height = ARVideo.width;
					document.body.appendChild(debugCanvas);
				}
				 // Needed for the library
				ctx = ARCanvas.getContext('2d');
				 // create reader for the video canvas
				ARRaster = new NyARRgbRaster_Canvas2D(ARCanvas);
				// create new Param for the canvas [~camera params]
				ARParams = new FLARParam(ARCanvas.width,ARCanvas.height); 
				// store matrices we get in this temp matrix
				ARResultMat = new NyARTransMatResult();
				// marker size is 0.07 (7cm) [transform matrix units]
				ARTracker = new FLARMultiIdMarkerDetector(ARParams, 0.07); 
				ARTracker.setContinueMode(true);
				
				state.inputDevices.local.webcamCameraParams = ARParams;
				state.inputDevices.local.webCameraImage = ARCanvas;
				
				callback(true);
			}, function(error) {callback(false);}
		);
	}
	
	var getGLMatrix = function(m) {
	  var matrix = [
			m[0], m[4], m[8], m[12],
			m[1], m[5], m[9], m[13],
			m[2], m[6], m[10], m[14],
			m[3], m[7], m[11], m[15]
	  ]
	  return matrix;
	};
	
	copyMarkerMatrix = function(arMat, glMat) {
		  glMat[0] = arMat.m00;
		  glMat[1] = -arMat.m10;
		  glMat[2] = arMat.m20;
		  glMat[3] = 0;
		  glMat[4] = arMat.m01;
		  glMat[5] = -arMat.m11;
		  glMat[6] = arMat.m21;
		  glMat[7] = 0;
		  glMat[8] = -arMat.m02;
		  glMat[9] = arMat.m12;
		  glMat[10] = -arMat.m22;
		  glMat[11] = 0;
		  glMat[12] = arMat.m03;
		  glMat[13] = -arMat.m13;
		  glMat[14] = arMat.m23;
		  glMat[15] = 1;
		}
	
}(VRUserInput));

