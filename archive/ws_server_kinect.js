#!/usr/bin/env node
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

// Create WebSocket server
var wss = new WebSocketServer({ port: 8080 });

// Handle incoming connections
wss.on('connection', function connection(ws) {
	console.log("Connection open");
	ws.on('message', function incoming(data) {
		wss.clients.forEach(function each(client) {
			client.send(data);
		});	
	});
});


 

