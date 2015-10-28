#!/usr/bin/env node
var fs = require('fs');
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

var ws_cfg = {
  ssl: true,
  port: 8080,
  ssl_key: '/etc/apache2/ssl/apache.key',
  ssl_cert: '/etc/apache2/ssl/apache.crt'
};

var processRequest = function(req, res) {
	console.log("Request received.")
};

var httpServ = require('https');
var app = null;

app = httpServ.createServer({
  key: fs.readFileSync(ws_cfg.ssl_key),
  cert: fs.readFileSync(ws_cfg.ssl_cert)
}, processRequest).listen(ws_cfg.port);

// Create WebSocket server
//var wss = new WebSocketServer({ port: 8080 });
var wss = new WebSocketServer( {server: app});
				
wss.on('open', function() {
	console.log("Connection open");
});
				
// Handle incoming connections
wss.on('connection', function connection(ws_client) {
	
	console.log("New connection");
	
	ws_client.on('message', function incoming(data) {
		var dataObject = JSON.parse(data);
		// Broadcast message
		wss.clients.forEach(function each(client) {
			if(ws_client != client) client.send(data);
		});	
		
	});
	
	ws_client.on('close', function incoming(data) {
		console.log("Client disconnected");
	});
	
});

