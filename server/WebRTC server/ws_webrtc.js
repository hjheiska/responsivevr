#!/usr/bin/env node
var fs = require('fs');
var url = require('url');
var path = require('path');
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;
var qs = require('querystring');
var crypto = require('crypto');
var SALT = "2015";

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};

var ws_cfg = {
  ssl: true,
  port: 443,
  ssl_key: 'certificates/self-signed.key',
  ssl_cert: 'certificates/self-signed.crt'
};

var processRequest = function(req, res) {

	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', 'https://54.93.164.209');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	
			
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
			var token = createToken(post.username, post.password);
			res.writeHead(200, "OK", {'Content-Type': 'text/html; charset=utf-8'});
			res.end(token);
        });
		
	}
	if(req.method == "GET") {
		var uri = url.parse(req.url).pathname;
		if(uri == "/") uri = "/index.html";
		var filename = path.join(process.cwd() + "/../../public_html", uri);
		
		fs.exists(filename, function(exists) {
			if(!exists) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write('404 Not Found\n' + filename);
				res.end();
				
			}
			else {
				var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
				res.writeHead(200, "OK", {'Content-Type': mimeType + '; charset=utf-8'});
				var fileStream = fs.createReadStream(filename);
				fileStream.pipe(res);
			}
		}); //end path.exists
	}
};


var createToken = function(username, password) {
	var shasum = crypto.createHash('sha512');
	shasum.update(username, 'utf8');
	shasum.update(password, 'utf8');
	shasum.update(SALT, 'utf8');
	return shasum.digest('hex')
}

var httpsServ = require('https');
var app = null;

app = httpsServ.createServer({
  key: fs.readFileSync(ws_cfg.ssl_key),
  cert: fs.readFileSync(ws_cfg.ssl_cert)
}, processRequest).listen(ws_cfg.port);


// HTTP redirect to HTTPS
var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

var isAdminClient = false;		
var sessions = [];				
var sessionCounter = 0;		
		
// Create WebSocket server
var wss = new WebSocketServer( {server: app, verifyClient: function(info) {
		var queryData = url.parse(info.req.url, true).query;
		
		if(typeof queryData.sessionid == 'undefined') {
			console.log("Session ID not defined. Blocking connection.");
			return false;
		}
		
		if(queryData.password != "") {
			console.log("Client is trying to create a session.");
			if(queryData.password == "salasana") isAdminClient = true;
			var newSession = {
				clients : []
			}
			newSession.clients.push(info.req.client);
			sessions[queryData.sessionid]  = newSession;
			info.req.client.sessionid = queryData.sessionid;
		}
		else if(typeof sessions[queryData.sessionid] != 'undefined') {
			console.log("Client is trying to join a session.");
			info.req.client.sessionid = queryData.sessionid;
			sessions[queryData.sessionid].clients.push(info.req.client);	
		}
		else {
			console.log("No session with provided id. Blocking connection.");
			return false;
		}
		console.log("Connection approved");
		return true;	
	}
});

				
			
// Handle incoming connections
wss.on('connection', function connection(ws_client) {
	console.log("Client connected. Session ID: " + ws_client.upgradeReq.client.sessionid);
	
	ws_client.on('message', function incoming(data) {
		var dataObject = JSON.parse(data);
		// Broadcast message
		wss.clients.forEach(function each(client) {
			console.log("Broadcasting " + data.length + " characters of data: " +  data + " on channel " + client.upgradeReq.client.sessionid + ".");
			if(ws_client != client && client.upgradeReq.client.sessionid == ws_client.upgradeReq.client.sessionid) client.send(data);	
		});	
	});
	
	ws_client.on('close', function incoming(data) {
		console.log("Client disconnected");	
	});
	
});

