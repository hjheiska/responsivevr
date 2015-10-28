process.env.NODE_TLS_REJECT_UNAUTHORIZED= "0";
var Kinect2 = require('kinect2');
var kinect = new Kinect2();
var bodyData = [];

var WebSocket = require('ws');
var ws = new WebSocket('wss://54.93.164.209:8080');
var wsConnectionIsOpen = false;

ws.on('open', function open() {
	console.log("Connection open");
	wsConnectionIsOpen = true;
});

ws.on('close', function close() {
	wsConnectionIsOpen = false;
});

if(kinect.open()) {
    console.log("Kinect Opened");
    
	//listen for body frames
    kinect.on('bodyFrame', function(bodyFrame){
		//console.log(bodyFrame.floorClipPlane);
		skeletons = [];      
		for(var i = 0;  i < bodyFrame.bodies.length; i++) {
           var body = bodyFrame.bodies[i];
			if(body.tracked && wsConnectionIsOpen) {
				bodyData = [];
				for(var jointType in body.joints) {
					var joint = body.joints[jointType];
					/*
					Content of join object:
					bodyIndex
					trackingId
					leftHandState
					rightHandState
					{ depthX: 0.646618664264679,
					  depthY: 1.136256217956543,
					  colorX: 0.6604278087615967,
					  colorY: 1.2500267028808594,
					  cameraX: 0.14181271195411682,
					  cameraY: -0.5341801643371582,
					  cameraZ: 0.6841580867767334,
					  orientationX: 0.49134165048599243,
					  orientationY: 0.8685199618339539,
					  orientationZ: 0.007077976129949093,
					  orientationW: 0.06485668569803238 },
					*/
					bodyData[jointType] = [];
					bodyData[jointType].push([joint.cameraX, joint.cameraY, joint.cameraZ]);
					bodyData[jointType].push([joint.orientationX, joint.orientationY, joint.orientationZ, joint.orientationW]);
					
				}
				skeletons.push(bodyData);
			}
		}
		if(skeletons.length > 0) {
			var newDataInJSON = JSON.stringify(skeletons);
			ws.send(newDataInJSON);
		}
    });

    //request body frames
    kinect.openBodyReader();

	// To close connection
	//kinect.close();
 
}



