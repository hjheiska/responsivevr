#!/usr/bin/env node
var fs = require('fs');
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;
var qs = require('querystring');
var crypto = require('crypto');
var SALT = "2015";

var ws_cfg = {
  ssl: true,
  port: 8080,
  ssl_key: '/etc/apache2/ssl/apache.key',
  ssl_cert: '/etc/apache2/ssl/apache.crt'
};

var processRequest = function(req, res) {
	console.log(req.url);
	if(req.method == "POST" && req.url == "/auth") {
		
		// http://stackoverflow.com/questions/4295782/how-do-you-extract-post-data-in-node-js
		var body = '';
		req.on('data', function (data) {
            body += data;
			// Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                request.connection.destroy();
        });

       req.on('end', function () {
            var post = qs.parse(body);
			
			// Website you wish to allow to connect
			res.setHeader('Access-Control-Allow-Origin', 'https://54.93.164.209');

			// Request methods you wish to allow
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

			// Request headers you wish to allow
			res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

			// Set to true if you need the website to include cookies in the requests sent
			// to the API (e.g. in case you use sessions)
			res.setHeader('Access-Control-Allow-Credentials', true);
			res.writeHead(200, "OK", {'Content-Type': 'text/html; charset=utf-8'});
			
			var token = createToken(post.username, post.password);
			res.end(token);
        });
		
	}
	console.log("Request received.")
};


var createToken = function(username, password) {
	console.log(username, password);
	var shasum = crypto.createHash('sha512');
	shasum.update(username, 'utf8');
	shasum.update(password, 'utf8');
	shasum.update(SALT, 'utf8');
	return shasum.digest('hex')
}

var httpServ = require('https');
var app = null;

app = httpServ.createServer({
  key: fs.readFileSync(ws_cfg.ssl_key),
  cert: fs.readFileSync(ws_cfg.ssl_cert)
}, processRequest).listen(ws_cfg.port);

// Create WebSocket server
var wss = new WebSocketServer( {server: app});
var adminClient = null;				
				
				
wss.on('open', function() {
	console.log("Connection open");
});
				
// Handle incoming connections
wss.on('connection', function connection(ws_client) {
	console.log("New connection");
	if(wss.clients.length > 2 || (wss.clients.length > 1 && adminClient == null)) {
		console.log("Only one admin and one client connection allowed. Admin needs to log in before the client.");
		ws_client.close();
	}
	
	ws_client.on('message', function incoming(data) {
		var dataObject = JSON.parse(data);
		
		// Hash for heikkisalasana2015
		if(dataObject.token == 	"ccbf83bb868d206b5e8a9b993cbc6ac79b75f88ee07a2" +
								"e4e8fad06439df9de8bd7dd9ff8cf9602c08da99d55f3" +
								"f43be86e0f7eefc5e68656b3c2ef974204ac61"
			) {
			if(adminClient == null) {
					adminClient = ws_client;
					console.log("Admin client verified.");
				}
			else {
				ws_client.close();
				console.log("Admin already logged in. Disconnecting admin client.");
			}
		}
		
		// Broadcast message
		wss.clients.forEach(function each(client) {
			console.log("Broadcasting " + data.length + " characters of data.");
			if(ws_client != client) client.send(data);
			
		});	
		
	});
	
	
	ws_client.on('close', function incoming(data) {
		if(ws_client == adminClient) adminClient = null;
		console.log("Client disconnected");	
	});
	
});

