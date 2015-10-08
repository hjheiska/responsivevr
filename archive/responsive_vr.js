


/*
*	ResponsiveVR:
* 	Requires ThreeJS revision 71
*/

ResponsiveVR = {}; 
(function (ResponsiveVR, SceneBuilder, responsiveVoice , window, screen, navigator) {

	var VRIsSupported = false; //navigator.mozGetVRDevices || navigator.getVRDevices;

	var renderer = null;
	var desktopRenderer = null;
	var camera = null;
	var scene = null;
	var controls = null;
	var cursor = null;
	var backgroundSphere = null;
	var raycaster = null; 
	
	var objectSelectedByCursor = {
		object: null,
		selectionStartTime: 0
	}

	menuActivationDelay = 4000;
	
	var sceneLoadedCheck = null;
	
	
	if(typeof  SpeechSynthesisUtterance !== 'undefined') {
		speechSynthesisUtterance = new SpeechSynthesisUtterance();
	}
	/*
	*	init: Init VR content of the page
	*/
	ResponsiveVR.init = function() {
		
		// Establish connection to Kinect 2 server
		kinect2data = {};
		kinect2data.data = {};
		Kinect2Bridge.establishBridge("ws://54.93.164.209:8080", kinect2data); 
		
		// Add fullscreen button
		addFullscreenButton(window.document.body);
		
		// Update global variables
		scene = SceneBuilder.createANewScene(); 
		
		desktopRenderer = SceneBuilder.getDesktopRenderer(screen.width, screen.height);
		if(VRIsSupported) renderer = SceneBuilder.getVRRenderer(desktopRenderer);
		else renderer = desktopRenderer;
		
		camera = SceneBuilder.getCamera(100, screen.width / screen.height);
		controls = SceneBuilder.getControls(camera, renderer.domElement, VRIsSupported);
		cursor = SceneBuilder.getCursorSphere();
		backgroundSphere = SceneBuilder.getBackgroundSphere();
		raycaster = SceneBuilder.getRayCaster();
		
		// Create scene from DOM elements
		DOMHandler.addHeaderToScene(document, scene);	
		DOMHandler.addSectionToScene(document, scene);
		DOMHandler.addFooterToScene(document, scene);
		SceneBuilder.buildScene(scene);
		SceneBuilder.addLights(scene);
		SceneBuilder.addCursor(scene, cursor);
		SceneBuilder.addBackgroundSphere(scene, backgroundSphere);
		setDefaultBackgroundSphere();
		
		sceneLoadedCheck = setInterval(checkIfSceneHasLoaded, 300);
		
		// Test rotation and location
		// End test
		avatar = new THREE.Object3D();
		avatar.rotation.set(0, Math.PI, 0, 'XYZ');
		avatar.position.set(0, -0.2, -0.6);
		scene.add(avatar);
		jointObjects = [];
		// Insert WebGL canvas into document
		insertWebGLCanvas(window.document.body, desktopRenderer.domElement);		
	}
	
	var animate = function() {
		
		
		// Test Kinect 2
		if(typeof  kinect2data.data[4] !== 'undefined') {
			for(var i = 0; i < 25; i++) {
				if(typeof  jointObjects[i] === 'undefined') {
					if(i == 3) jointObjects[i] = new THREE.Mesh( new THREE.CubeGeometry( 0.045, 0.045, 0.045 ), new THREE.MeshNormalMaterial() );
					else jointObjects[i] = new THREE.Mesh( new THREE.CubeGeometry( 0.025, 0.025, 0.025 ), new THREE.MeshNormalMaterial() );
					avatar.add(jointObjects[i]);
					//scene.add(jointObjects[i]);
				}
				
				// Position
				var position = new THREE.Vector3(kinect2data.data[i][0][0], kinect2data.data[i][0][1], kinect2data.data[i][0][2]);
				position.divideScalar(5);
				
				jointObjects[i].position.copy(position);
				// Rotation
				var quaternion = new THREE.Quaternion();
				quaternion.set(kinect2data.data[i][1][0], kinect2data.data[i][1][1], kinect2data.data[i][1][2], kinect2data.data[i][1][3]);
				jointObjects[i].rotation.setFromQuaternion(quaternion);
				
				if(i == 3) jointObjects[i].rotation.copy(camera.rotation);
				
				//if(i == 3) camera.position.set(kinect2data.data[i][0][0], kinect2data.data[i][0][1], kinect2data.data[i][0][2]);
			}
		}
		// End test
		if(document.mozFullScreenElement || document.webkitFullscreenElement) {
			desktopRenderer.domElement.style.display = "block";
			handleCursorSelection(scene, camera);
			controls.update();
			renderer.render(scene, camera);
		}
		else {
			desktopRenderer.domElement.style.display = "none";
		}
		
		handleVideoTextures(scene.vr.videoObjects);
		
		requestAnimationFrame(animate);
		
	}
	
	/*
	*	reInit: Re-inits VR content using new markup
	*/
	ResponsiveVR.reInit = function(new_markup) {
		
		// Replace header, section and footer elements with new markup
		var newBody = document.createElement("BODY");
		newBody.innerHTML = new_markup;
		document.body.getElementsByTagName("header")[0].innerHTML = newBody.getElementsByTagName("header")[0].innerHTML;
		document.body.getElementsByTagName("section")[0].innerHTML = newBody.getElementsByTagName("section")[0].innerHTML;
		document.body.getElementsByTagName("footer")[0].innerHTML = newBody.getElementsByTagName("footer")[0].innerHTML;
		
		// Destroy old scene objects
		destroyScene(scene);
		
		// Re-create scene
		scene = SceneBuilder.createANewScene(); 
		DOMHandler.addHeaderToScene(document, scene);	
		DOMHandler.addSectionToScene(document, scene);
		DOMHandler.addFooterToScene(document, scene);
		SceneBuilder.buildScene(scene);
		SceneBuilder.addLights(scene);
		SceneBuilder.addCursor(scene, cursor);
		setDefaultBackgroundSphere();
		SceneBuilder.addBackgroundSphere(scene, backgroundSphere);
		
		sceneLoadedCheck = setInterval(checkIfSceneHasLoaded, 300);
		
	}
	
	var destroyScene = function(scene) {
		// http://stackoverflow.com/questions/3258587/how-to-properly-unload-destroy-a-video-element

		// Video objects
		for(var j = 0; j < scene.vr.videoObjects.length; j++) {
			scene.vr.videoObjects[j].vr.videoElement.pause();
			scene.vr.videoObjects[j].vr.videoElement.remove();
		}
		// Objects
		for(var j = 0; j < scene.vr.objects.length; j++) {
			scene.vr.objects[j].remove();
		}
		// Everything else
		// http://stackoverflow.com/questions/18385564/how-the-elements-of-scene-children-in-threejs-can-be-accessed
		while (scene.children.length > 0) {
			scene.remove(scene.children[scene.children.length - 1]);
		}

	}
	
	window.onkeydown=function(event){
		if(event.keyCode == 90 && VRIsSupported) {
			 resetView();
		}
	};
	
	function resetView() {
	navigator.getVRDevices().then(function(devices) {
	  for (var i = 0; i < devices.length; ++i) {
		if (devices[i] instanceof HMDVRDevice) {
		  gHMD = devices[i];
		  break;
		}
	  }

	  if (gHMD) {
		for (var i = 0; i < devices.length; ++i) {
		  if (devices[i] instanceof PositionSensorVRDevice && devices[i].hardwareUnitId === gHMD.hardwareUnitId) {
			gPositionSensor = devices[i];
			gPositionSensor.resetSensor();
			break;
		  }
		}
	  }
	});
}
	
	var checkIfSceneHasLoaded = function() {
		if(!SceneBuilder.isLoadingScene() && responsiveVoice) {
			console.log("Loading scene done.");
			clearInterval(sceneLoadedCheck);
			setDefaultBackgroundSphere();
			// Start animation loop with new scene
			animate();
		}
		
	}
	
	
	
	var handleVideoTextures = function(videoObjects) {
		
		if(videoObjects.length > 0) {
			for(var j = 0; j < videoObjects.length; j++) {
				if(videoObjects[j].vr.videoElement.paused && videoObjects[j].visible) videoObjects[j].vr.videoElement.play();
				else if(!videoObjects[j].visible && !videoObjects[j].vr.videoElement.paused) videoObjects[j].vr.videoElement.pause();
				if ( videoObjects[j].vr.videoElement.readyState === videoObjects[j].vr.videoElement.HAVE_ENOUGH_DATA ) 
				{
					videoObjects[j].vr.videoContext.drawImage( videoObjects[j].vr.videoElement, 0, 0 );
					if ( videoObjects[j].vr.videoTexture ) 
						videoObjects[j].vr.videoTexture.needsUpdate = true;
				}
			}
		}
		
	}
	
	var addFullscreenButton = function(element) {

		// VR logos from https://github.com/borismus/webvr-boilerplate
		var logoCardboard = Utils.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMjAuNzQgNkgzLjIxQzIuNTUgNiAyIDYuNTcgMiA3LjI4djEwLjQ0YzAgLjcuNTUgMS4yOCAxLjIzIDEuMjhoNC43OWMuNTIgMCAuOTYtLjMzIDEuMTQtLjc5bDEuNC0zLjQ4Yy4yMy0uNTkuNzktMS4wMSAxLjQ0LTEuMDFzMS4yMS40MiAxLjQ1IDEuMDFsMS4zOSAzLjQ4Yy4xOS40Ni42My43OSAxLjExLjc5aDQuNzljLjcxIDAgMS4yNi0uNTcgMS4yNi0xLjI4VjcuMjhjMC0uNy0uNTUtMS4yOC0xLjI2LTEuMjh6TTcuNSAxNC42MmMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTMgMS4xOCAwIDIuMTIuOTYgMi4xMiAyLjEzcy0uOTUgMi4xMi0yLjEyIDIuMTJ6bTkgMGMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTNzMi4xMi45NiAyLjEyIDIuMTMtLjk1IDIuMTItMi4xMiAyLjEyeiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ii8+Cjwvc3ZnPgo=');
		var logoFullscreen = Utils.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNyAxNEg1djVoNXYtMkg3di0zem0tMi00aDJWN2gzVjVINXY1em0xMiA3aC0zdjJoNXYtNWgtMnYzek0xNCA1djJoM3YzaDJWNWgtNXoiLz4KPC9zdmc+Cg==');
		
		var fullScreenContainer = document.createElement("div");
		fullScreenContainer.style.position = "fixed";
		fullScreenContainer.style.left = "50%";
		fullScreenContainer.style.bottom = "0px";
		fullScreenContainer.style.zIndex = "1";
		
		var fullScreenLink = document.createElement("a");
		fullScreenLink.style.position = "relative";
		fullScreenLink.style.left = "-50%";
		fullScreenLink.setAttribute('href',  '#');
		fullScreenLink.onclick = function() { ResponsiveVR.activateFullscreen(); };

		var fullscreenImage = document.createElement("img");
		fullscreenImage.style.backgroundColor = "grey";
		fullscreenImage.style.borderRadius = "15px";
		fullscreenImage.style.padding = "3px";
		if(VRIsSupported) fullscreenImage.setAttribute('src', logoCardboard);
		else fullscreenImage.setAttribute('src',  logoFullscreen);

		fullScreenLink.appendChild(fullscreenImage);
		fullScreenContainer.appendChild(fullScreenLink);
	
		element.appendChild(fullScreenContainer);
	}
	
	ResponsiveVR.activateFullscreen = function() {
		
		if(VRIsSupported) {
			renderer.setFullScreen(true);
		}
		else {
			if ( renderer.domElement.mozRequestFullScreen ) {
				renderer.domElement.mozRequestFullScreen();
			} else if ( renderer.domElement.webkitRequestFullscreen ) {
				renderer.domElement.webkitRequestFullscreen();
			}
		}
	}

	var insertWebGLCanvas = function(element, canvas) {
		element.appendChild(canvas);
	}
	

	var handleCursorSelection = function(scene, camera) {
		
		var intersects = SceneBuilder.getIntersects(raycaster, camera, scene, scene.vr.linkObjects);
		
		var validCursorTargetFound = false;
		var currentlySelectedObject = null;
		for(var i = 0; i < intersects.length; i++) {
			if(intersects[i].object.name != "linkSphere") continue;
			if(typeof intersects[i].object.parent !== 'undefined') {
				if(typeof intersects[i].object.parent.vr !== 'undefined') {
					if(typeof intersects[i].object.parent.vr.type !== 'undefined') {
						if(!intersects[i].object.parent.visible) continue;
						switch(intersects[i].object.parent.vr.type) {
							case "article":
							case "content":
							case "link":
								validCursorTargetFound = true;
								currentlySelectedObject = intersects[i].object.parent;
								cursor.position.set(intersects[i].point.x, intersects[i].point.y, intersects[i].point.z);
							break;
						}
					}
				}
			}	
		}
		
		if(validCursorTargetFound && !cursor.visible) cursor.visible = true;
		else if(!validCursorTargetFound && cursor.visible) cursor.visible = false;
		
		var d = new Date(); 
		var currentTime = d.getTime();
		if(currentlySelectedObject == null) {
			if(objectSelectedByCursor.object != null) {
				cursor.material.color.setHex(0xff0000);
				cursor.scale.set(1,1,1);
				objectSelectedByCursor.object.linkTriggered = false;
			}
			objectSelectedByCursor.object = null;
			objectSelectedByCursor.selectionStartTime = 0;
		}
		else if(objectSelectedByCursor.object != currentlySelectedObject) {
			currentlySelectedObject.vr.linkTriggered = false;
			objectSelectedByCursor.object = currentlySelectedObject;
			objectSelectedByCursor.selectionStartTime = currentTime;
		}
		else if(objectSelectedByCursor.object == currentlySelectedObject) {
			var selectionProgress = currentTime - objectSelectedByCursor.selectionStartTime;
			var colorPercentage = (selectionProgress /  menuActivationDelay);
			
			if(selectionProgress > menuActivationDelay) {
				if(!currentlySelectedObject.linkTriggered) {
					handleTrigger(currentlySelectedObject);
					currentlySelectedObject.linkTriggered = true;
				}
			}
			else {
				var cursorScale = (1 + colorPercentage * 5);
				cursor.scale.set(cursorScale, cursorScale, cursorScale);
				cursor.material.color.setRGB(1 - colorPercentage,colorPercentage,0);
			}
		}	
	}
	
	var handleTrigger = function(currentlySelectedObject) {
		
		switch(currentlySelectedObject.vr.type) {
			case "article":
				changeHudContents(currentlySelectedObject.vr.index, 0);
			break;
			case "content":
				changeHudContents(currentlySelectedObject.vr.articleIndex, currentlySelectedObject.vr.contentIndex);
				
				//window.responsiveVoice.speak(currentlySelectedObject.vr.HTMLcontent);
				
			break;
			case "link":
				Utils.ajaxRequest("GET", currentlySelectedObject.vr.href, true, "reInit", "ResponsiveVR");
			break;
		}
	}
	
	var setBackgroundSphere = function(articleIndex, contentIndex) {
		var backgroundSphereTexture = scene.vr.objects.content[articleIndex][contentIndex].vr.backgroundSphereTexture;
		if(backgroundSphereTexture) SceneBuilder.changePhotoSphere(backgroundSphere,backgroundSphereTexture);
		else setDefaultBackgroundSphere();
	}
	
	var setDefaultBackgroundSphere = function() {
		var backgroundSphereTexture = scene.vr.objects.articles[0].vr.backgroundSphereTexture;
		if(backgroundSphereTexture) {
			SceneBuilder.changePhotoSphere(backgroundSphere,backgroundSphereTexture);
		}
		else SceneBuilder.resetPhotoSphere(backgroundSphere);
	}
	
	var speakTextAloud = function(text) {
		if(typeof  SpeechSynthesisUtterance !== 'undefined') { // Chrome
			window.speechSynthesis.cancel();
			speechSynthesisUtterance.text = text;
			window.speechSynthesis.speak(speechSynthesisUtterance);
		}
		else {
			responsiveVoice.cancel();
			responsiveVoice.speak(text, "UK English Female");
		}
	}
	
	var changeHudContents = function(articleIndex, contentIndex) {
		
		// Reset backgroundSphere if heading back to mainmenu
		// 
		if(!(scene.vr.objects["articles"][articleIndex].vr.opened && contentIndex == 0)) {
			setBackgroundSphere(articleIndex, contentIndex);
			var text = Utils.stripHTML(scene.vr.objects["content"][articleIndex][contentIndex].vr.HTMLcontent);
			speakTextAloud(text);	
		}
		else setDefaultBackgroundSphere();
		
		if(contentIndex == 0) {
			for(var i = 0; i < scene.vr.objects["articles"].length; i++) {
				if(!scene.vr.objects["articles"][articleIndex].vr.opened) // && i != articleIndex)
					scene.vr.objects["articles"][i].visible = false;
				else
					scene.vr.objects["articles"][i].visible = true;	
				if(typeof scene.vr.objects["content"][i] !== 'undefined') {
					for(var j = 0; j < scene.vr.objects["content"][i].length; j++) {
						if(scene.vr.objects["articles"][articleIndex].vr.opened || i != articleIndex) scene.vr.objects["content"][i][j].visible = false;	
						else {
							scene.vr.objects["content"][i][j].visible = true;
						}
					}
				}
			}
			scene.vr.objects["articles"][articleIndex].vr.opened = !scene.vr.objects["articles"][articleIndex].vr.opened;
		}
	}
	
	/*
	*	DOMHandler class: 
	*	Parses the dom tree and sends requests
	*	to the sceneBuilder
	*/
	
	DOMHandler = {}; 	
	(function (DOMHandler) {
		/*
		*	addHeaderToScene: Creates link planes from li elements inside header/nav/ul
		*/
		DOMHandler.addHeaderToScene = function(document, scene) {
			var headerTag = document.getElementsByTagName("header")[0];
			var ulTag = headerTag.getElementsByTagName("ul")[0];
			var liTags = ulTag.getElementsByTagName("li");
			
			for(var i = 0; i < liTags.length; i++) {
				var aTag = liTags[i].getElementsByTagName("a")[0];
				var title = aTag.innerHTML;
				var href = Utils.getStringAttribute(aTag, "href", "");
				var linkIndex = i;
				// Add link to scene
				SceneBuilder.addLink(scene, linkIndex, href, title);
			}
		}
		
		var getBackgroundSphereInformation = function(element) {
			var imageSource = Utils.getStringAttribute(element, "imageSphere", ""); 
			var videoSource = Utils.getStringAttribute(element, "videoSphere", ""); 
			var videoWidthInPixels = Utils.getStringAttribute(element, "videoWidthInPixels", "100|100"); 
			var videoHeightInPixels = Utils.getStringAttribute(element, "videoHeightInPixels", "100|100"); 
			
			var backgroundSphere = {
				image : {
					source : imageSource
				},
				video : {
					source : videoSource,
					widthInPixels: videoWidthInPixels,
					heightInPixels : videoHeightInPixels
				}
			}
			
			return backgroundSphere;
		}
		
		/*
		*	addSectionToScene: Create content plane from article tags inside section
		*/
		DOMHandler.addSectionToScene = function(document, scene) {
			var sectionTag = document.getElementsByTagName("section")[0];
			var articleTags = sectionTag.getElementsByTagName("article");
			
			for(var i = 0; i < articleTags.length; i++) {
				var headerTag = articleTags[i].getElementsByTagName("header")[0];
				var h2Tag = headerTag.getElementsByTagName("h2")[0];
				var pTags = articleTags[i].getElementsByTagName("p");
				var imgTag = articleTags[i].getElementsByTagName("img")[0];
				
				var articleTitle = h2Tag.innerHTML;
				var articleIndex = i;
				
				var articleImage = "";
				if(imgTag) articleImage = Utils.getStringAttribute(imgTag, "src", "");
				// Add article to scene
				
				var backgroundSphere = getBackgroundSphereInformation(articleTags[i]);
				SceneBuilder.addArticle(scene, articleIndex, articleTitle, articleImage, backgroundSphere);
				
				var contents = pTags;
				
				for(var j = 0; j < contents.length; j++) {
					// Add content to scene
					var imgTag = contents[j].getElementsByTagName("img")[0];
					if(imgTag) contentImage = Utils.getStringAttribute(imgTag, "src", "");
					else contentImage = "";
					
					var backgroundSphere = getBackgroundSphereInformation(contents[j]);	
					SceneBuilder.addParagraph(scene, articleIndex, contents[j].innerHTML, backgroundSphere, contentImage);
				}
			}
		}
		
		/*
		*	addFooterToScene: Create content plane from article tags inside section
		*/
		DOMHandler.addFooterToScene = function(document, scene) {
			var footerTag = document.getElementsByTagName("footer")[0];
			// Add footer to scene
			SceneBuilder.addFooter(scene, footerTag.innerHTML);
		}
	}(DOMHandler));
	
}(ResponsiveVR, SceneBuilder, responsiveVoice, window, screen, navigator));

/*
*	Kinect 2 bridge
*	Get Kinect 2 data from a NodeJS server
*/

Kinect2Bridge = {}; 
(function (Kinect2Bridge) {
	
	Kinect2Bridge.establishBridge = function(serverUri, dataObject) {
		serverSyncConnection = new WebSocket(serverUri);
		
		serverSyncConnection.onopen = function(evt) {  
				console.log("Connection opened");
		};
		
		serverSyncConnection.onmessage = function(evt) {  
			var newDataInJSON = evt.data;
			var newData = JSON.parse(newDataInJSON);
			dataObject.data = newData;
		};
	}
}(Kinect2Bridge));


