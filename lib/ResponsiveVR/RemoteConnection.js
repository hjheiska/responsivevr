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
(function (RemoteConnection) {

	var kinect2Data = null;
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
	
		
		
	RemoteConnection.connectTo = function(sceneModel) {
		state = sceneModel.state;
		syncLoop();
	}

	
	var syncLoop = function() {
			
		/*
		// Kinect 2 data (WebSocket)	
		if(kinect2Data == null && !connecting) { 
			connecting = true;
			setTimeout(function(){ 
				console.log("Connecting to Kinect 2 server");
				Kinect2Bridge.establishBridge("wss://54.93.164.209:8080", kinect2Data); 
				connecting = false;
			}, 10000); 	
		}
		*/
		// HMD, audio and scene state (WebRTC) 
		if(webRTCData.connection == null && webRTCData.connecting == false) {
			webRTCData.connecting = true;
			setTimeout(function(){ 
				console.log("Establishing WebRTC channel");
				WebRTC_Channel.establishChannel("wss://54.93.164.209:8080",  webRTCData);
			}, 1000); 	
		}
		else {
			if(state.newStateToSend && webRTCData.channel) {
				state.newStateToSend = false;
				var newState = JSON.stringify(state.navigation);
				webRTCData.channel.sendMessage(newState);	
			}
			if(webRTCData.newMessage) {
				
				var newData = JSON.parse(webRTCData.data);
				
				if(typeof newData.index != 'undefined')  {
					// New state
					state.navigation = newData;
					state.newStateReceived = true;
				}
				else {
					// New skeleton data
					// newData.data[i][0] -> position of joint i
					// newData.data[i][1] -> rotation of joint i
					state.inputDevices.local.skeletons = newData;
				}
				webRTCData.newMessage = false;
				
			}
		}
		
		requestAnimationFrame(syncLoop);
	}
	
}(RemoteConnection));
	
	
WebRTC_Channel = {};

(function (WebRTC_Channel) {	
	var webcamStream = null;
	var remoteWebcamStream = null;
		
	WebRTC_Channel.establishChannel = function(serverUri, dataObject) {
		var signalingChannel = new WebSocket("wss://54.93.164.209:8080");
		
		var isServer = (typeof Utils.QueryString.password !== 'undefined');
		
		
		signalingChannel.onopen = function(evt) {  
			
			dataObject.connection = signalingChannel;
			dataObject.connecting = false;
			console.log("WebRTC signalling channel opened");
			// If is the server, send password to identify
			if(isServer) signalingChannel.send(JSON.stringify({ 'password' : Utils.QueryString.password }));
			
			navigator.getUserMedia({ video: true }, 
			function(stream) {
				webcamStream = stream;
				rtcChannel = getRtcChannel(isServer, signalingChannel, dataObject);
				dataObject.channel = rtcChannel;
				dataObject.stream = webcamSteam;
			},  
			function(err) {
				console.log("Could not get access to web camera");
				// Just open data channel
				rtcChannel = getRtcChannel(isServer, signalingChannel, dataObject);
				dataObject.channel = rtcChannel;
			});
		};
		
	
		signalingChannel.onerror = function() {
			dataObject.connecting =  false;
		}
		
		signalingChannel.onclose = function() {
			dataObject.connecting =  false;
		}
		
	}
	
	
	function getRtcChannel(isServer, signalingChannel, dataObject) {
		
		
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
		};
		
		if(webcamStream) rtcPeerConnection.addStream(webcamStream);
		
		
		// Data channel configuration
		if(!isServer) rtcPeerConnection.dataChannel = createDataChannel("testChannel", rtcPeerConnection, dataObject);
	
		
		/*
		*	2. Send offer to signalling server if client
		*/
		if(!isServer) {
			rtcPeerConnection.createOffer(function(desc) {
				// Set clients description
				// Setting local description triggers rtcPeerConnection.onicecandidate
				rtcPeerConnection.setLocalDescription(desc, function () {
					console.log("Sending SDP");
					console.log(JSON.stringify({'sdp': rtcPeerConnection.localDescription}));
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
			if(isServer) rtcPeerConnection.dataChannel = event.channel;	
		};
		
		rtcPeerConnection.sendMessage = function(message) {
			if(typeof rtcPeerConnection.dataChannel !== 'undefined') {
				if(rtcPeerConnection.dataChannel.readyState == "closed") rtcPeerConnection.dataChannel = createDataChannel("testChannel", rtcPeerConnection, dataObject);
				if(rtcPeerConnection.dataChannel.readyState == "open") {
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
		signalingChannel.onclose = function(evt) {  console.log("Connection closed");  };
		
		return rtcPeerConnection;
	}
	
	var createDataChannel = function(dataChannelName, rtcPeerConnection, dataObject) {
		var dataChannel = rtcPeerConnection.createDataChannel(dataChannelName);
		dataChannel.onerror = function (error) { console.log("Data Channel Error:", error);};
		dataChannel.onmessage = function (event) { dataObject.data = event.data; dataObject.newMessage = true; };
		dataChannel.onopen = function () {  console.log("Channel open"); };
		dataChannel.onclose = function () { console.log("The Data Channel is Closed");	};
		return dataChannel;
	}
	
	
}(WebRTC_Channel));	
	
	
Kinect2Bridge = {}; 
(function (Kinect2Bridge) {
	
	Kinect2Bridge.establishBridge = function(serverUri, dataObject) {
		serverSyncConnection = new WebSocket(serverUri);
		dataObject = { };
		
		serverSyncConnection.onopen = function(evt) {  
				console.log("Kinect2 connection opened");
		};
		
		serverSyncConnection.onclose = function(evt) {  
				connectionObject = null;
		};
		
		
		
		serverSyncConnection.onmessage = function(evt) {  
			var newDataInJSON = evt.data;
			var newData = JSON.parse(newDataInJSON);
			dataObject.data = newData;
		};
	}
}(Kinect2Bridge));	