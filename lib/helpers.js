
/*
*	Helper functions
*/
var Utils = {};
Utils.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Utils.stripHTML = function(html) {
	var div = document.createElement("div");
	div.innerHTML = html;
	var text = div.textContent || div.innerText || "";
	return text;
}

Utils.convertAnglesToRadians = function(ThreeJSVector) {
	ThreeJSVector.x = (ThreeJSVector.x / 360) * (Math.PI * 2);
	ThreeJSVector.y = (ThreeJSVector.y / 360) * (Math.PI * 2);
	ThreeJSVector.z = (ThreeJSVector.z / 360) * (Math.PI * 2);
	return ThreeJSVector;
}

Utils.getFloatAttribute = function(element, attributeName, defaultValue) {
	var value = defaultValue;
	if(element.getAttribute(attributeName)) {
		value = parseFloat(element.getAttribute(attributeName));
	}	
	return value;
}

Utils.getStringAttribute = function(element, attributeName, defaultValue) {
	
	var value = defaultValue;
	if(element.getAttribute(attributeName)) {
		value = element.getAttribute(attributeName);
	}	
	return value;
}

Utils.getIntAttribute = function(element, attributeName, defaultValue) {
	var value = defaultValue;
	if(element.getAttribute(attributeName)) {
		value = parseInt(element.getAttribute(attributeName));
	}	
	return value;
}

Utils.getVector3Attribute = function(element, attributeName, defaultValue) {
	var object = defaultValue;
	if(element.getAttribute(attributeName)) {
		var value = element.getAttribute(attributeName).split(",");
		object = new THREE.Vector3(parseFloat(value[0]), parseFloat(value[1]), parseFloat(value[2]));
	}	
	return object;
}

Utils.addFullscreenLink = function(desktopRenderer) {
	// VR logos from https://github.com/borismus/webvr-boilerplate
	var logoCardboard = Utils.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMjAuNzQgNkgzLjIxQzIuNTUgNiAyIDYuNTcgMiA3LjI4djEwLjQ0YzAgLjcuNTUgMS4yOCAxLjIzIDEuMjhoNC43OWMuNTIgMCAuOTYtLjMzIDEuMTQtLjc5bDEuNC0zLjQ4Yy4yMy0uNTkuNzktMS4wMSAxLjQ0LTEuMDFzMS4yMS40MiAxLjQ1IDEuMDFsMS4zOSAzLjQ4Yy4xOS40Ni42My43OSAxLjExLjc5aDQuNzljLjcxIDAgMS4yNi0uNTcgMS4yNi0xLjI4VjcuMjhjMC0uNy0uNTUtMS4yOC0xLjI2LTEuMjh6TTcuNSAxNC42MmMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTMgMS4xOCAwIDIuMTIuOTYgMi4xMiAyLjEzcy0uOTUgMi4xMi0yLjEyIDIuMTJ6bTkgMGMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTNzMi4xMi45NiAyLjEyIDIuMTMtLjk1IDIuMTItMi4xMiAyLjEyeiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ii8+Cjwvc3ZnPgo=');
	var logoFullscreen = Utils.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNyAxNEg1djVoNXYtMkg3di0zem0tMi00aDJWN2gzVjVINXY1em0xMiA3aC0zdjJoNXYtNWgtMnYzek0xNCA1djJoM3YzaDJWNWgtNXoiLz4KPC9zdmc+Cg==');

	var fullScreenContainer = document.createElement("div");
	fullScreenContainer.style.position = "fixed";
	//fullScreenContainer.style.left = "50%";
	fullScreenContainer.style.right = "10px";
	fullScreenContainer.style.top = "10px";
	fullScreenContainer.style.zIndex = "1";
	
	var fullScreenLink = document.createElement("a");
	fullScreenLink.style.position = "relative";
	//fullScreenLink.style.left = "-50%";
	fullScreenLink.setAttribute('href',  '#');
	fullScreenLink.onclick = function() { activateFullscreen(); };

	var fullscreenImage = document.createElement("img");
	fullscreenImage.style.backgroundColor = "grey";
	fullscreenImage.style.borderRadius = "15px";
	fullscreenImage.style.padding = "3px";
	if(VRIsSupported) fullscreenImage.setAttribute('src', logoCardboard);
	else fullscreenImage.setAttribute('src',  logoFullscreen);

	fullScreenLink.appendChild(fullscreenImage);
	fullScreenContainer.appendChild(fullScreenLink);
	desktopRenderer.domElement.parentNode.appendChild(fullScreenContainer);
}

Utils.getVideoObject = function(videoSources, geometry, videoWidths, videoHeights) {
		
		var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
		var videoSources = videoSources.split("|");
		var videoWidths = videoWidths.toString().split("|");
		var videoHeights = videoHeights.toString().split("|");
		
		if(is_chrome) {
			var videoSource = videoSources[1];
			var videoWidth = parseInt(videoWidths[1]);
			var videoHeight = parseInt(videoHeights[1]);	
		}
		else {
			var videoSource = videoSources[0];
			var videoWidth = parseInt(videoWidths[0]);
			var videoHeight = parseInt(videoHeights[0]);	
		}
		
		video = document.createElement( 'video' );
		video.src = videoSource;
		video.loop = true;
		video.autoplay = false;
		video.load(); 
		video.pause();
		var videoImage = document.createElement( 'canvas' );
		videoImage.width = videoWidth;
		videoImage.height = videoHeight;
		var videoImageContext = videoImage.getContext( '2d' );
		videoImageContext.fillStyle = '#000000';
		videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
		var videoTexture = new THREE.Texture( videoImage );
		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
		
		var material = new THREE.MeshBasicMaterial( {
		  map: videoTexture, //texture
		  overdraw: true,
		  side:THREE.FrontSide
		} );
		var videoObject = new THREE.Mesh( geometry, material );
		videoObject.name = "videoObject";
		// Legacy support
		videoObject.vr_video = video;
		videoObject.vr_context = videoImageContext;
		videoObject.vr_texture = videoTexture;
		// New variable structure
		videoObject.vr.videoElement = video;
		videoObject.vr.videoContext = videoImageContext;
		videoObject.vr.videoTexture = videoTexture;
		
		return videoObject;
	}
	
Utils.getVideoTexture = function(videoSources, videoWidths, videoHeights) {
		
		var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
		var videoSources = videoSources.split("|");
		var videoWidths = videoWidths.toString().split("|");
		var videoHeights = videoHeights.toString().split("|");
		
		if(is_chrome) {
			var videoSource = videoSources[1];
			var videoWidth = parseInt(videoWidths[1]);
			var videoHeight = parseInt(videoHeights[1]);	
		}
		else {
			var videoSource = videoSources[0];
			var videoWidth = parseInt(videoWidths[0]);
			var videoHeight = parseInt(videoHeights[0]);	
		}
		
		var video = document.createElement( 'video' );
		video.src = videoSource;
		video.loop = true;
		video.autoplay = false;
		video.load(); 
		video.pause();
		var videoImage = document.createElement( 'canvas' );
		videoImage.width = videoWidth;
		videoImage.height = videoHeight;
		var videoImageContext = videoImage.getContext( '2d' );
		videoImageContext.fillStyle = '#000000';
		videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
		var videoTexture = new THREE.Texture( videoImage );
		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
		videoTexture.vr = {};
		videoTexture.vr.video = video;
		videoTexture.vr.context = videoImageContext;
		return videoTexture;
	}
	
	
//http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter
Utils.QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
    return query_string;
}();

// http://stackoverflow.com/questions/23013573/swap-key-with-value-json
Utils.swap = function(json){
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

Utils.UTFtoBinary = function(sceneStatusInJSON) {
	
	var binaryData = new Uint8Array(sceneStatusInJSON.length);
	for(var i = 0; i < sceneStatusInJSON.length; i++) {
		if(binaryConversionTable[sceneStatusInJSON[i]])
			binaryData[i] = binaryConversionTable[sceneStatusInJSON[i]];
		else
			console.log("Not handled: " + sceneStatusInJSON[i]);
	}
	return binaryData;
}

Utils.binaryToUTF = function(sceneStatusInBinary) {
	
	var JSONData = "";
	var utfConversionTable = Utils.swap(binaryConversionTable);
	
	for(var i = 0; i < sceneStatusInBinary.length; i++) {
		if(utfConversionTable[sceneStatusInBinary[i]])
			JSONData += utfConversionTable[sceneStatusInBinary[i]];
		else
			console.log("Not handled: " + sceneStatusInBinary[i]);
	}
	return JSONData;
	
}

Utils.ajaxRequest = function(method, uri, data, callback) {
	// http://www.w3schools.com/ajax/ajax_xmlhttprequest_create.asp
	var xmlhttp;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
	  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}

	xmlhttp.onreadystatechange=function() {
		if (xmlhttp.readyState==4 && (xmlhttp.status==200 || xmlhttp.status==0)) {
			callback(xmlhttp.responseText);
		}
	}
	xmlhttp.open(method.toUpperCase(),uri,true);
	if(data) {
		// "fname=Henry&lname=Ford"
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send(data);
	}
	else {
		xmlhttp.send(null);
	}
}

Utils.getVisualAngle = function(elementWidth, radius) {
	var circumference = radius * Math.PI * 2;
	var visualAngle = (elementWidth / circumference) * Math.PI * 2;
	return visualAngle;
}

Utils.getXYPositionAndRotationOnCircle = function(elementVisualAngle, elementIndex, numberOfElements, radius) {
	var angleOffsetFromCenter = (numberOfElements / 2) * elementVisualAngle;
	var elementAngleOffsetFromLeft = (elementIndex * elementVisualAngle) + (elementVisualAngle / 2);
	var elementAngle = -angleOffsetFromCenter + elementAngleOffsetFromLeft;
	var xzPositionAndRotation = {
		z : Math.cos(elementAngle) * radius,
		x : Math.sin(elementAngle) * radius,
		rotation: -elementAngle + (2 * Math.PI)
	}
	return xzPositionAndRotation;
}

Utils.getMarkupRenderedSize = function(html) {
	var newDiv = document.createElement("DIV");
	newDiv.innerHTML = html;
	newDiv.style.visibility = "hidden";
	document.body.appendChild(newDiv);
	var dimensions = {
		height: newDiv.childNodes[0].offsetHeight * 1.2, // Fix for chrome rasterizing
		width: newDiv.childNodes[0].offsetWidth
	}
	document.body.removeChild(newDiv);
	return dimensions;
	/*	
		newDiv.clientHeigh
		newDiv.offsetHeight
		newDiv.scrollHeight
	*/	
}

// http://stackoverflow.com/questions/4825683/how-do-i-create-and-read-a-value-from-cookie
Utils.createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

Utils.getCookie = function(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

