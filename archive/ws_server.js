#!/usr/bin/env node
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

var sceneStatus = 
{
	s : // Server
	{
		s : 0, // Current scene
		o: 0 // Current object
	},
	r: 
	{
		c : { x : 0, y : 0, z : 0 }, // Client head rotation (Euler)
		s : { x : 0, y : 0, z : 0 }
	}
};


// Create WebSocket server
var wss = new WebSocketServer({ port: 8080 });

// Handle incoming connections
wss.on('connection', function connection(ws) {
	
	// Update incoming client with latest status
	updateAllClients();
	
	ws.on('message', function incoming(newSceneStatus) {
		
		// 1. Update scene status according to incoming message
		//var sceneStatusAsJsonString = binaryToUTF(newSceneStatus);
		//var sceneStatusAsJsonObject = JSON.parse(sceneStatusAsJsonString);
		var sceneStatusAsJsonObject = JSON.parse(newSceneStatus);
		if(sceneStatusAsJsonObject.s) sceneStatus.s = sceneStatusAsJsonObject.s;
		if(sceneStatusAsJsonObject.r) {
			if(sceneStatusAsJsonObject.r.c) sceneStatus.r.c = sceneStatusAsJsonObject.r.c;
			if(sceneStatusAsJsonObject.r.s) sceneStatus.r.s = sceneStatusAsJsonObject.r.s;
		}
		// 2. Send latest status to all clients
		updateAllClients();
		
	});
});

function updateAllClients() {
	var sceneStatusAsJsonString = JSON.stringify(sceneStatus);
	//var sceneStatusInBinary = UTFtoBinary(sceneStatusAsJsonString);
	//console.log("Byte length:" + Buffer.byteLength(sceneStatusAsJsonString, 'utf8')); 
	wss.clients.forEach(function each(client) {
		client.send(sceneStatusAsJsonString);
		//client.send(sceneStatusInBinary, { binary: true, mask: true });
	});
}

/*
*	Utils
*/

// http://stackoverflow.com/questions/23013573/swap-key-with-value-json
swap = function(json){
  var ret = {};
  for(var key in json){
    ret[json[key]] = key;
  }
  return ret;
}

var binaryConversionTable = 
{
	"0": 1,
	"1": 2,
	"2": 3,
	"3": 4,
	"4": 5,
	"5": 6,
	"6": 7,
	"7": 8,
	"8": 9,
	"9": 10,
	"-": 11,
	",": 12,
	".": 13,
	"{": 14,
	"}": 15,
	"[": 16,
	"]": 17,
	"s": 18,
	"o": 19,
	"c": 20,
	"r": 21,
	"u": 22,
	":": 23,
	"x": 24,
	"y": 25,
	"z": 26,
	"e": 27,
	"\"": 28
};


function UTFtoBinary(sceneStatusInJSON) {
	
	var binaryData = new Uint8Array(sceneStatusInJSON.length);
	for(var i = 0; i < sceneStatusInJSON.length; i++) {
		if(binaryConversionTable[sceneStatusInJSON[i]])
			binaryData[i] = binaryConversionTable[sceneStatusInJSON[i]];
		else
			console.log("Not handled: " + sceneStatusInJSON[i]);
	}
	return binaryData;
}

function binaryToUTF(sceneStatusInBinary) {
	
	var JSONData = "";
	var utfConversionTable = swap(binaryConversionTable);
	
	for(var i = 0; i < sceneStatusInBinary.length; i++) {
		if(utfConversionTable[sceneStatusInBinary[i]])
			JSONData += utfConversionTable[sceneStatusInBinary[i]];
		else
			console.log("Not handled: " + sceneStatusInBinary[i]);
	}
	return JSONData;
	
} 

 

