/*
*	RemoteConnection
*	
*
*/

var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection ||  window.webkitRTCPeerConnection || window.msRTCPeerConnection;
var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate || window.msRTCIceCandidate;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

RemoteConnection = {};
(function (RemoteConnection, SessionControl) {
	
	var webRTCData = {
		connection : null,
		data : null,
		connecting : false,
		stream : null,
		channel : null,
		newMessage : false
	};
	var state = null;
	var connecting = false;
	var disconnect = false;
	var logInAsAdmin = false;
	var adminPassword = "";
	var session_id = "";
	RemoteConnection.connectionIsOpen = function() {
		return (webRTCData.connection != null)
	}
	
	RemoteConnection.startConnection = function(id, password) {
		disconnect = false;
		if(password != null) {
			adminPassword = password;
			logInAsAdmin = true;
			state.moveToAdminView = true;
		}
		session_id = id;
		syncLoop();
	}
	
	RemoteConnection.disconnect = function() {
		disconnect = true;
		webRTCData.connection.close();
	}
		
	RemoteConnection.connectTo = function(sceneModel) {
		state = sceneModel.state;
	}
	
	RemoteConnection.reConnectTo = function(sceneModel) {
		state = sceneModel.state;
		if(logInAsAdmin) state.moveToAdminView = true;
	}

	
	var syncLoop = function() {
			
		// HMD, audio and scene state (WebRTC)
		// and Kinect 2 data (WS)
		if(webRTCData.connection == null && webRTCData.connecting == false) {
			webRTCData.connecting = true;
			setTimeout(function(){ 
				console.log("Establishing WebRTC channel");
				WebRTC_Channel.establishChannel("wss://54.93.164.209" + "?sessionid=" + session_id + "&password=" + adminPassword,  webRTCData, logInAsAdmin);
			}, 1000); 	
		}
		else {
			
			if(webRTCData.channel) {
				// Send scene state changes
				if(state.newStateToSend) {
					state.newStateToSend = false;
					var newState = JSON.stringify(state.navigation);
					webRTCData.channel.sendMessage(newState);	
				}
				// Send input device data
				var newState = JSON.stringify(state.inputDevices.local.cameraRotation);
				webRTCData.channel.sendMessage(newState);	
			}
				
			// Receive data
			if(webRTCData.newMessage) {
				
				var newData = JSON.parse(webRTCData.data);
				
				if(typeof newData.index != 'undefined')  {
					// New state
					state.navigation = newData;
					state.newStateReceived = true;
				}
				else if(typeof newData._x != 'undefined')  {
					state.inputDevices.remote.cameraRotation = newData;
				}
				else {
					// New skeleton data
					if(logInAsAdmin) state.inputDevices.local.skeletons = newData;
					else state.inputDevices.remote.skeletons = newData;
				}
				webRTCData.newMessage = false;
				
			}
		}
		if(!disconnect) requestAnimationFrame(syncLoop);
	}
	
}(RemoteConnection, SessionControl));
	
	
WebRTC_Channel = {};

(function (WebRTC_Channel) {	
	var webcamStream = null;
	var remoteWebcamStream = null;
		
	WebRTC_Channel.establishChannel = function(serverUri, dataObject, logInAsAdmin) {
		var signalingChannel = new WebSocket(serverUri);
		
		signalingChannel.onopen = function(evt) {  
			
			dataObject.connection = signalingChannel;
			dataObject.connecting = false;
			console.log("WebRTC signalling connection opened");
			
			navigator.getUserMedia({ audio: true }, 
			function(stream) {
				webcamStream = stream;
				rtcChannel = getRtcChannel(logInAsAdmin, signalingChannel, dataObject);
				dataObject.channel = rtcChannel;
				dataObject.stream = webcamStream;
			},  
			function(err) {
				console.log("Could not get access to web camera");
				// Just open data channel
				rtcChannel = getRtcChannel(logInAsAdmin, signalingChannel, dataObject);
				dataObject.channel = rtcChannel;
			});
		};
		
		signalingChannel.onerror = function(error) {
			console.log("Could not open WebRTC signalling connection:" + error);
			dataObject.connecting =  false;
			dataObject.connection = null;
		}
		
		signalingChannel.onclose = function() {
			console.log("WebRTC signalling connection closed");
			dataObject.connecting =  false;
			dataObject.connection = null;
		}
		
	}
	
	
	function getRtcChannel(logInAsAdmin, signalingChannel, dataObject) {
		
		
		// ICE server configuration
		var configuration = { 'iceServers': [
			{
			'url': 'stun:stun.l.google.com:19302', 
			'url': 'stun:stun.l.google.com:19302', 
			'url': 'stun:stun1.l.google.com:19302', 
			'url': 'stun:stun2.l.google.com:19302', 
			'url': 'stun:stun3.l.google.com:19302', 
			'url': 'stun:stun4.l.google.com:19302', 
			'url': 'stun:stun01.sipphone.com', 
			'url': 'stun:stun.ekiga.net', 
			'url': 'stun:stun.fwdnet.net', 
			'url': 'stun:stun.ideasip.com', 
			'url': 'stun:stun.iptel.org', 
			'url': 'stun:stun.rixtelecom.se', 
			'url': 'stun:stun.schlund.de', 
			'url': 'stun:stunserver.org', 
			'url': 'stun:stun.softjoys.com', 
			'url': 'stun:stun.voiparound.com', 
			'url': 'stun:stun.voipbuster.com', 
			'url': 'stun:stun.voipstunt.com', 
			'url': 'stun:stun.voxgratia.org', 
			'url': 'stun:stun.xten.com'
			}
			]};
		var rtcPeerConnection = new RTCPeerConnection(configuration);
		
		
		rtcPeerConnection.onaddstream = function(event) {
			remoteWebcamStream = event.stream;
			// Warning: don't uncomment when doing local multiuser test
			// var player = new Audio();
			// player.autoplay = 'autoplay';
			// player.srcObject = event.stream;
			// player.play();
		};
		
		if(webcamStream) rtcPeerConnection.addStream(webcamStream);
		
		// Data channel configuration
		if(!logInAsAdmin) rtcPeerConnection.dataChannel = createDataChannel("dataChannel", rtcPeerConnection, dataObject);
		
		/*
		*	2. Send offer to signalling server if client
		*/
		if(!logInAsAdmin) {
			rtcPeerConnection.createOffer(function(desc) {
				// Set clients description
				// Setting local description triggers rtcPeerConnection.onicecandidate
				rtcPeerConnection.setLocalDescription(desc, function () {
					console.log("Sending SDP");
					//console.log(JSON.stringify({'sdp': rtcPeerConnection.localDescription}));
					signalingChannel.send(JSON.stringify({'sdp': rtcPeerConnection.localDescription}));
				}, console.log);
			}, console.log); 
		}
		
		/*
		*	3a. Send icecandidate incase created own or received one
		*/
		rtcPeerConnection.onicecandidate = function (evt) {
			console.log("Sending ice candidate");
			if (evt.candidate)
				signalingChannel.send(JSON.stringify({'candidate': evt.candidate}));
		};
		
		/*
		*	3b. Wait for SDP information
		*	
		*	- In case an offer arrives, send an answer
		*	- Incase an cadidate information arrives, add it to candidates
		*/
		signalingChannel.onmessage = function (evt) {
			console.log("Message received: " + evt.data);
			var message = JSON.parse(evt.data);
			
			if(message.sdp || message.candidate) {
				if (message.sdp) {
					rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
						// If message was an offer, send an answer
						if (rtcPeerConnection.remoteDescription.type == 'offer') {
							console.log("Sending answer");
							rtcPeerConnection.createAnswer(function(desc) {
								// Set servers description
								// Setting local description triggers rtcPeerConnection.onicecandidate
								rtcPeerConnection.setLocalDescription(desc, function () {
									signalingChannel.send(JSON.stringify({'sdp': rtcPeerConnection.localDescription}));
								}, console.log);
							}, console.log);
						}
					}, console.log);
				}
				
				if (message.candidate) {
					console.log("Adding candidate");
					rtcPeerConnection.addIceCandidate(new RTCIceCandidate(message.candidate)); 
				}
			}
			else {
				dataObject.newMessage = true;
				dataObject.data = evt.data;
			}
		};
		
		rtcPeerConnection.ondatachannel = function (event) {
			event.channel.onmessage = function (event) {
				dataObject.newMessage = true;
				dataObject.data = event.data;
			};
			if(logInAsAdmin) rtcPeerConnection.dataChannel = event.channel;	
		};
		
		rtcPeerConnection.sendMessage = function(message) {
			if(typeof rtcPeerConnection.dataChannel !== 'undefined') {
				if(rtcPeerConnection.dataChannel.readyState == "closed") rtcPeerConnection.dataChannel = createDataChannel("dataChannel", rtcPeerConnection, dataObject);
				if(rtcPeerConnection.dataChannel.readyState == "open") {
					//console.log("Sending " + message.length + " characters of data over WebRTC.");
					rtcPeerConnection.dataChannel.send(message);
				}
			}
			else {
				console.log("Could not send message. Data channel not ready");
			}
		}
		
		/*
		*	Debug
		*/
		rtcPeerConnection.oniceconnectionstatechange = function(evt) {  console.log("ICE connection state change: " + evt.target.iceConnectionState);}
		
		return rtcPeerConnection;
	}
	
	var createDataChannel = function(dataChannelName, rtcPeerConnection, dataObject) {
		var dataChannel = rtcPeerConnection.createDataChannel(dataChannelName);
		dataChannel.onerror = function (error) { console.log("Data Channel Error:", error);};
		dataChannel.onmessage = function (event) { 
			dataObject.data = event.data; dataObject.newMessage = true; 
			//console.log("Receiving " + event.data.length + " characters of data over WebRTC"); 
		};
		dataChannel.onopen = function () {  console.log("Channel open"); };
		dataChannel.onclose = function () { console.log("The Data Channel is Closed");	};
		return dataChannel;
	}
	
	
}(WebRTC_Channel, SessionControl));	
	
