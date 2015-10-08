/*
*	Loads and adds a background sphere to the scene
*
*	- Currently supports image, color, video and 3dmodel backgrounds
*/
var SceneBuilder = {};
(function (SceneBuilder) {
	
	SceneBuilder.loadAndAddBackground = function(backgroundElement, scene) {	
		var type = Utils.getStringAttribute(backgroundElement, "type", "");
		var backgroundObject;
		
		var skybox = Utils.getStringAttribute(backgroundElement, "skybox", "");
		var color = Utils.getStringAttribute(backgroundElement, "color", "");
		var video = Utils.getStringAttribute(backgroundElement, "video", "");
		var model = Utils.getStringAttribute(backgroundElement, "model", "");
		
		
		var geometry = new THREE.SphereGeometry( 5000, 64, 32 );
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		
		var objectPosition = Utils.getVector3Attribute(backgroundElement, "position", new THREE.Vector3(0, 0, 0));
		var objectRotation = Utils.getVector3Attribute(backgroundElement, "rotation", new THREE.Vector3(0, 0, 0));
		objectRotation.y -= 90; 
		objectRotation = Utils.convertAnglesToRadians(objectRotation);
		var objectScale = Utils.getVector3Attribute(backgroundElement, "scale", new THREE.Vector3(1, 1, 1));
		
		
		if(video) {
			var videoWidthInPixels = Utils.getStringAttribute(backgroundElement, "videoWidthInPixels", "100");
			var videoHeightInPixels = Utils.getStringAttribute(backgroundElement, "videoHeightInPixels", "100");
			var videoObject = Utils.getVideoObject(video, geometry, videoWidthInPixels, videoHeightInPixels);
			scene.videoObjects.push(videoObject);
			backgroundObject = videoObject;
			backgroundObject.rotation.set(objectRotation.x, objectRotation.y, objectRotation.z);
			addObjectToScene(scene, backgroundObject, backgroundElement, null, true);
		}
		else if(color != "" || skybox != "") {
			
			if(skybox != "") {
				var texture = THREE.ImageUtils.loadTexture( skybox );
				texture.minFilter = THREE.LinearFilter;
				var material = new THREE.MeshBasicMaterial( {
				  map: texture,
				  side: THREE.FrontSide
				} );
			}
			else {
				var material = new THREE.MeshBasicMaterial( {color: color} );		
			}
			backgroundObject = new THREE.Mesh( geometry, material );
			backgroundObject.rotation.set(objectRotation.x, objectRotation.y, objectRotation.z);
			addObjectToScene(scene, backgroundObject, backgroundElement, null, true);
		}
		if(model) {
			
			loadAndAddObject("objmtl", model, scene, objectPosition, objectRotation, objectScale, backgroundElement, null, true);
		}
		
		parseAndAddAudioElements(scene, backgroundElement);
		
		
	}

	/*
	*
	*	Construct and adds the globe links
	*
	*/
	SceneBuilder.constructAndAddGlobeElements = function(globeElement) {
		
		var sphereRadius = 1;
		var geometry = new THREE.SphereGeometry( sphereRadius, 64, 32 );
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		var texture = THREE.ImageUtils.loadTexture( "img/earth.jpg" );
		texture.minFilter = THREE.LinearFilter;
		
		var material = new THREE.MeshBasicMaterial( {
		  map: texture,
		  transparent: true,
		  opacity: 0.8
		} );
		
		backgroundObject = new THREE.Mesh( geometry, material );
		backgroundObject.name = "globeObject";
		var mapOffset = -Math.PI / 2;
		backgroundObject.rotation.set(0,mapOffset,0);
		globeObject  = backgroundObject;
			
		// TODO: Add controls to rotate globe
		
		// Location objects
		
		// Latitude 0 -> 90
		// Longtitude -180 -> 180
		var locations = globeElement.getElementsByTagName("LOCATION");
		for(var i = 0; i < locations.length; i++) {
			var latlon = Utils.getStringAttribute(locations[i], "latlon", "0|0").split("|");
			var textureURI = Utils.getStringAttribute(locations[i], "texture", "");
			var color = Utils.getStringAttribute(locations[i], "color", "yellow");
			var objectScale = Utils.getVector3Attribute(locations[i], "scale", new THREE.Vector3(1, 1, 1));
			
			var lat = (parseFloat(latlon[0]) / 90) * Math.PI / 2;
			var lon = ((parseFloat(latlon[1]) / 180) * Math.PI) +mapOffset ;
			
			var markerRadius = sphereRadius - 0.2;
			var innerCircleRadius = Math.cos(lat) * markerRadius;
			var y = Math.sin(lat) * markerRadius;
			
			var x = Math.sin(lon) * innerCircleRadius;
			var z = -Math.cos(lon) * innerCircleRadius;
			
			var geometry = new THREE.SphereGeometry( 0.025 * objectScale.z, 32, 32 ); 
			
			var texture = THREE.ImageUtils.loadTexture( textureURI );
			texture.minFilter = THREE.LinearFilter;
			if(texture) {
				var material = new THREE.MeshBasicMaterial( { map: texture });
			}
			else {
				var material = new THREE.MeshBasicMaterial( { color: color });
			}
			locationObject = new THREE.Mesh( geometry, material );
			
			locationObject.position.set(x,y,z);
			locationObject.lookAt(new THREE.Vector3(-x, -y, -z));			
			locationObject.name="locationObject";
			globeObject.add(locationObject);
			var link = Utils.getStringAttribute(locations[i], "link", "");
			if(link) makeLinkObject(locationObject, link, false);		
		}
		
	}
	/*
	*	Hide/Show globe
	*/
	SceneBuilder.toggleGlobe = function() {
		var globeObjectInScene = scenes[currentScene].getObjectByName("globeObject");
		if(globeObjectInScene) scenes[currentScene].remove(globeObjectInScene);
		else scenes[currentScene].add(globeObject);
	}
	
	
	/*
	*
	*	Constructs and adds world objects into scene
	*
	*	- Currently support HTML, video and model content
	*	- TODO: Avatar content support
	*
	*/

	SceneBuilder.constructAndAddWorldElements = function(worldElement, scene) {
		var worldElements = sceneContainers[i].getElementsByTagName("world")[0].getElementsByTagName("content");
		for(var k = 0; k < worldElements.length; k++) {
			var contentType = worldElements[k].getAttribute("type");
			
			var objectPosition = Utils.getVector3Attribute(worldElements[k], "position", new THREE.Vector3(0, 0, 0));
			var objectRotation = Utils.getVector3Attribute(worldElements[k], "rotation", new THREE.Vector3(0, 0, 0));
			objectRotation = Utils.convertAnglesToRadians(objectRotation);
			var objectScale = Utils.getVector3Attribute(worldElements[k], "scale", new THREE.Vector3(1, 1, 1));
			
			var visible = (Utils.getStringAttribute(worldElements[k], "visible", "true") === "true");
			
			switch(contentType) {
					
					case "html":
						var physicalWidth = Utils.getFloatAttribute(worldElements[k], "physicalWidth", "");
						var physicalHeight = Utils.getFloatAttribute(worldElements[k], "physicalHeight", "");
						var widthInPixels = Utils.getIntAttribute(worldElements[k], "widthInPixels", 100);
						var heightInPixels = Utils.getIntAttribute(worldElements[k], "heightInPixels", 100);
						var html = worldElements[k].innerHTML;
						var geometry = new THREE.PlaneGeometry( physicalWidth, physicalHeight, 2 );
						loadAndAddHTML(html, scene, geometry, objectPosition, objectRotation, widthInPixels, heightInPixels, worldElements[k], null, visible);
					break;
					case "object": 
					case "video":				
					case "shape":		
						var objectSource = Utils.getStringAttribute(worldElements[k], "source", "");
						switch(contentType) {
							case "shape":
									var shape = Utils.getStringAttribute(worldElements[k], "shape", "sphere");
									var color = Utils.getStringAttribute(worldElements[k], "color", "lightblue");
									var opacity = Utils.getFloatAttribute(worldElements[k], "opacity", 1);
									
									switch(shape) {
										
										case "circle":
											var geometry = new THREE.CircleGeometry( 1, 32 );	
										break;
										
										default:
										case "sphere":
											var geometry = new THREE.SphereGeometry( 1, 32, 32 ); 
										break;
									}
									
									
									
		
									
									var texture = Utils.getStringAttribute(worldElements[k], "texture", "");
									if(texture != "") {
										var texture = THREE.ImageUtils.loadTexture( texture );
										texture.minFilter = THREE.LinearFilter;
										var material = new THREE.MeshBasicMaterial( {
										  map: texture
										} );
									}
									else {
										var material = new THREE.MeshBasicMaterial( 
											{ 
												color: color, 
												transparent: true, 
												opacity: opacity
											});
									}											
									var object = new THREE.Mesh( geometry, material ); 
									object.position.set(objectPosition.x, objectPosition.y, objectPosition.z);
									object.rotation.set(objectRotation.x, objectRotation.y, objectRotation.z, "XYZ");
									object.scale.set(objectScale.x, objectScale.y, objectScale.z);
									addObjectToScene(scene, object, worldElements[k], null, visible);
								break;
							case "object":
								loadAndAddObject("objmtl", objectSource, scene, objectPosition, objectRotation, objectScale, worldElements[k], null, visible);
							break;
							case "video":
								var physicalWidth = Utils.getFloatAttribute(worldElements[k], "physicalWidth", "");
								var aspectRatio = Utils.getFloatAttribute(worldElements[k], "screenAspectRatio", "");
								var physicalHeight = physicalWidth / aspectRatio;
								var videoWidthInPixels = Utils.getStringAttribute(worldElements[k], "videoWidthInPixels", 100);
								var videoHeightInPixels = Utils.getStringAttribute(worldElements[k], "videoHeightInPixels", 100);
						
								var geometry = new THREE.PlaneGeometry( physicalWidth, physicalHeight, 2 );
								var object = Utils.getVideoObject(objectSource, geometry, videoWidthInPixels, videoHeightInPixels);
								scene.videoObjects.push(object);
								object.position.set(objectPosition.x, objectPosition.y, objectPosition.z);
								object.rotation.set(objectRotation.x, objectRotation.y, objectRotation.z, "XYZ");
								object.scale.set(objectScale.x, objectScale.y, objectScale.z);
								addObjectToScene(scene, object, worldElements[k], null, visible);	
							break;
						}
					break;
				}
		}
	}

	/*
	*
	*	Constructs a hud mesh with requested content
	*	and adds it to the scene
	*
	*	- Currently support HTML, video and model content
	*	- TODO: Avatar content support
	*
	*/

	SceneBuilder.constructAndAddHud = function(hudElements, scene) {
		
		for(var i = 0; i < hudElements.length; i++) {
			
			var hudElement = hudElements[i];
			var hudWidthInPixels = hudElement.getAttribute("widthInPixels");
			var hudHeightInPixels = hudElement.getAttribute("heightInPixels");
			var hudBlocks = hudElement.getElementsByTagName("block");
			var html = "";
			var offset = 0;
			var multiplier = 1;
			var circumference = 3.6 * multiplier;
			var radius = circumference / 3.14 / 2;
			var height = 0.9 * multiplier;
			
			var hudObjectPosition = Utils.getVector3Attribute(hudElement, "position", new THREE.Vector3(0, 0, 0));
			var hudObjectRotation = Utils.getVector3Attribute(hudElement, "rotation", new THREE.Vector3(0, 0, 0));
			hudObjectRotation = Utils.convertAnglesToRadians(hudObjectRotation);
			
			var parentObjectCollector = [];
			
			var visible = (Utils.getStringAttribute(hudElement, "visible", "true") === "true");
			
			for(var j = 0; j < hudBlocks.length; j++) {
				var elementWidth = parseInt(hudBlocks[j].getAttribute("widthInPixels"));
				var elementHeight = parseInt(hudBlocks[j].getAttribute("heightInPixels"));
				var contentBlocks = hudBlocks[j].getElementsByTagName("content");
				if(!elementHeight) elementHeight = hudHeightInPixels;
				
				html += '<div style="width:' + elementWidth + 'px; height: ' + elementHeight + 'px; float: left;">';
				
				
				
				for(var k = 0; k < contentBlocks.length; k++) {
					
					var contentType = contentBlocks[k].getAttribute("type");
					switch(contentType) {
						case "html":
							html += contentBlocks[k].innerHTML;
						break;
						case "object": 
						case "video":	
						case "shape":		
							var objectPosition = Utils.getVector3Attribute(contentBlocks[k], "position", new THREE.Vector3(0, 0, 0));
							var objectRotation = Utils.getVector3Attribute(contentBlocks[k], "rotation", new THREE.Vector3(0, 0, 0));
							objectRotation = Utils.convertAnglesToRadians(objectRotation);
							var objectScale = Utils.getVector3Attribute(contentBlocks[k], "scale", new THREE.Vector3(1, 1, 1));
							var objectSource = Utils.getStringAttribute(contentBlocks[k], "source", "");
							
							var angleStart = ((offset / hudWidthInPixels) * (Math.PI * 2)) + Math.PI;
							var angleEnd = (((offset + elementWidth) / hudWidthInPixels) * (Math.PI * 2)) + Math.PI;
							var middleAngle = (angleStart + angleEnd) / 2;
							middleAngle += (objectPosition.x / hudWidthInPixels) * (Math.PI * 2)
							var itemCircleRadius = radius - objectPosition.z;
							var objectX = itemCircleRadius * (Math.round(Math.sin(middleAngle) * 1000) / 1000) + objectPosition.x;
							var objectY = objectPosition.y + hudObjectPosition.y;
							var objectZ = -itemCircleRadius * Math.round(Math.cos(middleAngle) * 1000) / 1000;
							var objectPosition = new THREE.Vector3(objectX, objectY, objectZ);
							objectRotation.y -= middleAngle;
						
							switch(contentType) {
								case "shape":
									var shape = Utils.getStringAttribute(contentBlocks[k], "shape", "sphere");
									var color = Utils.getStringAttribute(contentBlocks[k], "color", "lightblue");
									var opacity = Utils.getFloatAttribute(contentBlocks[k], "opacity", 1);
									var geometry = new THREE.SphereGeometry( 1, 32, 32 ); 
									var material = new THREE.MeshBasicMaterial( 
										{ 
											color: color, 
											transparent: true, 
											opacity: opacity
										}); 
									var object = new THREE.Mesh( geometry, material ); 
									object.position.set(objectPosition.x, objectPosition.y, objectPosition.z);
									object.rotation.set(objectRotation.x, objectRotation.y, objectRotation.z, "XYZ");
									object.scale.set(objectScale.x, objectScale.y, objectScale.z);
									addObjectToScene(scene, object, contentBlocks[k], parentObjectCollector, visible);
								break;
								case "object":
									loadAndAddObject("objmtl", objectSource, scene, objectPosition, objectRotation, objectScale, contentBlocks[k], parentObjectCollector, visible);
								break;
								case "video":
									var videoWidth = Utils.getIntAttribute(contentBlocks[k], "videoWidthInPixels", 100);
									var videoHeight = Utils.getIntAttribute(contentBlocks[k], "videoHeightInPixels", 100);
									var screenWidthInPixels = Utils.getIntAttribute(contentBlocks[k], "screenWidthInPixels", 100);
									var screenWidth = (screenWidthInPixels / hudWidthInPixels) * circumference;
									var screenAspectRatio = videoWidth / videoHeight; //Utils.getStringAttribute(contentBlocks[k], "screenAspectRatio", 1);
									var screenHeight = screenWidth / screenAspectRatio;
									
									var geometry = new THREE.PlaneGeometry( screenWidth, screenHeight, 2 );
									var object = Utils.getVideoObject(objectSource, geometry, videoWidth, videoHeight);
									scene.videoObjects.push(object);
									object.position.set(objectPosition.x, objectPosition.y, objectPosition.z);
									object.rotation.set(objectRotation.x, objectRotation.y, objectRotation.z, "XYZ");
									object.scale.set(objectScale.x, objectScale.y, objectScale.z);
									addObjectToScene(scene, object, contentBlocks[k], parentObjectCollector, visible);
								break;
							}
						break;
					}
					
				}
				offset += elementWidth;
				html += '</div>';
			}
			
			var geometry = new THREE.CylinderGeometry( radius, radius, height, 60, 1, true );
			geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
					
			html = '<div style="width:' + hudWidthInPixels + 'px; height: ' + hudHeightInPixels + 'px">' + html + '</div>';
			loadAndAddHTML(html, scene, geometry, hudObjectPosition, hudObjectRotation, hudWidthInPixels, hudHeightInPixels, hudElement, parentObjectCollector, visible);
		}	
	}

	/*
	*	Make objects with animations move
	*/
		
	SceneBuilder.animateObjects = function(animatedObjects, timeAtStartOfScript, currentScene) {
		var d = new Date(); 
		var n = d.getTime() - timeAtStartOfScript; 
		
		for(var i = 0; i < scenes[currentScene].animatedObjects.length; i++)  {
			for(var j = 0; j < scenes[currentScene].animatedObjects[i].vr_animations.length; j++)  {
				
				var animation = scenes[currentScene].animatedObjects[i].vr_animations[j];
				var animationType = animation.type;
				var duration = animation.duration;
				var radius = (animation.maxValue - animation.minValue) / 2;
				var middlePoint = animation.minValue + radius;
				
				switch(animationType) {
					case "sineWobble":
						var sinPhase = ((n % (duration * 1000)) / (duration * 1000)) * Math.PI * 2;
						var valueShift = middlePoint;
						var phaseShift = Math.asin(-valueShift / radius);
						var value = ( radius * Math.sin(sinPhase + phaseShift) ) + valueShift;
						switch(animation.direction) {
							case "x": scenes[currentScene].animatedObjects[i].position.x = animation.originalPosition.x + value; break;
							case "y": scenes[currentScene].animatedObjects[i].position.y = animation.originalPosition.y + value; break;
							case "z": scenes[currentScene].animatedObjects[i].position.z = animation.originalPosition.z + value; break;
						}
					break;
					case "rotation":
						var sinPhase = (((n % (duration * 1000)) / (duration * 1000)) * Math.PI * 2);
						var value = sinPhase;
						switch(animation.direction) {
							case "x": scenes[currentScene].animatedObjects[i].rotation.x = value; break;
							case "y": scenes[currentScene].animatedObjects[i].rotation.y = value; break;
							case "z": scenes[currentScene].animatedObjects[i].rotation.z = value; break;
						}
					break;
				}
			}
		}		
	}
	
	/*
	*
	*	Load object and add it to scene
	*
	*	- Currently supports obj+mtl models
	*/
	var loadAndAddObject = function(type, src, scene, position, rotation, scale, element, parentObjectCollector, visible) {
		src = src.toString();
		var loader = new THREE.OBJMTLLoader();
		switch(type) {
			case "objmtl":
				var loader = new THREE.OBJMTLLoader();
				var objURI = src.split("|")[0];
				var mtlURI = src.split("|")[1];
				loader.load( objURI, mtlURI, 
					function ( object ) {
						object.position.set(position.x, position.y, position.z);
						object.rotation.set(rotation.x, rotation.y, rotation.z, "XYZ");
						object.scale.set(scale.x, scale.y, scale.z);
						addObjectToScene(scene, object, element, parentObjectCollector, visible)
				});
			break;
		}
	}	
		
	/*
	*	Loads and adds a mesh with texture made by rasterizing HTML
	*/

	var loadAndAddHTML = function(html, scene, geometry, position, rotation, canvasWidth, canvasHeight, element, parentObjectCollector, visible) {
		
		var canvas = document.createElement('canvas');
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		var context = canvas.getContext('2d');
		rasterizeHTML.drawHTML(html).then(function (renderResult) {
			context.drawImage(renderResult.image, 0, 0, canvasWidth, canvasHeight);
			
			var dynamicTexture = new THREE.Texture(canvas);
			dynamicTexture.needsUpdate = true;
			var material = new THREE.MeshBasicMaterial( { 
			  transparent: true, 
			  side: THREE.FrontSide,
			  map: dynamicTexture 
			});
			var mesh = new THREE.Mesh( geometry, material );
			mesh.position.set(position.x, position.y, position.z);
			mesh.rotation.set(rotation.x, rotation.y, rotation.z, "XYZ");
			addObjectToScene(scene, mesh, element, parentObjectCollector, visible);
		});
	}	
	
	/*
	*	A gateway function to do final manipulations to object before sending to scene
	*/

	var addObjectToScene = function(scene, object, element, parentObjectCollector, visible) {
		
		// Animations
		var animations = element.getElementsByTagName("ANIMATION");
		if(animations) {
			object.vr_animations = [];	
			for(var i = 0; i < animations.length; i++) {
				if(animations[i].parentNode.tagName != element.tagName) continue;
				var animationType = Utils.getStringAttribute(animations[i], "type", "");
				switch(animationType) {
					
					case "sineWobble":
						var newAnimation = {
							type				: animationType,
							direction 			: Utils.getStringAttribute(animations[i], "direction", "x"),
							minValue 			: Utils.getFloatAttribute(animations[i], "minValue", -1),
							maxValue 			: Utils.getFloatAttribute(animations[i], "maxValue", 1),
							duration			: Utils.getFloatAttribute(animations[i], "duration", 1),
							originalPosition	: {
								x : object.position.x,
								y : object.position.y,
								z : object.position.z,
							}
						}
						object.vr_animations.push(newAnimation);
					break;
					case "rotation":
						var newAnimation = {
							type				: animationType,
							direction 			: Utils.getStringAttribute(animations[i], "direction", "x"),
							duration			: Utils.getFloatAttribute(animations[i], "duration", 1),
							originalRotation	: {
								x : object.rotation.x,
								y : object.rotation.y,
								z : object.rotation.z,
							}
						}
						object.vr_animations.push(newAnimation);
					break;
				}	
				
			}
			scene.animatedObjects.push(object);
		}
		
		// Name
		object.name = Utils.getStringAttribute(element, "name", "");
		
		// Item links
		var objectLink = Utils.getStringAttribute(element, "link", "");
		if(objectLink) { 
			 makeLinkObject(object, objectLink, true);
		}
		
		// Check visibility at startup
		if(!visible) object.visible = false;
			
		// Init fadein/fadeout timer
		object.fadeStartTime = -1;
		
		// Push object to parentObjectCollector (used with huds objects)
		if(parentObjectCollector) parentObjectCollector.push(object);
		object.vr_parentObjectCollector = parentObjectCollector;
		
		// Pass on to scene
		scene.add(object);
	}
	
	function makeLinkObject(object, objectLink, useSphere) {
		
		
		if(!useSphere) {
			var group = new THREE.Object3D();//create an empty container
			group.linkTriggered = false;
			group.link = objectLink;
			object.parent.add(group);
			group.add(object);
			linkObjects.push(object);
		}
		else {
			object.link = objectLink;
			// Menu selection sphere mesh to help with cursor selection
			var menuSelectionSphereGeom =  new THREE.SphereGeometry( 0.05 / object.scale.z, 20, 10 );
			var transparentMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.1 } );
			var menuSelectionSphere = new THREE.Mesh( menuSelectionSphereGeom, transparentMaterial );
			menuSelectionSphere.name = "selectionSphere";
			object.linkTriggered = false;
			object.add(menuSelectionSphere);
			linkObjects.push(menuSelectionSphere);
		}
	}
	/*
	*	Add all audio elements into scene
	*/

	function parseAndAddAudioElements(scene, element) {
		var audioElements = element.getElementsByTagName("audio");
		for(var i = 0; i < audioElements.length; i++) {
			var position = Utils.getVector3Attribute(audioElements[i], "position", new THREE.Vector3(0, 0, 0));
			var source = Utils.getStringAttribute(audioElements[i], "source", "");
			var volume = Utils.getFloatAttribute(audioElements[i], "volume", 0.1);
			var referenceDistance = Utils.getFloatAttribute(audioElements[i], "referenceDistance", 1);
			addAudioToObject(scene, position, source, volume, referenceDistance);
		}
	}
	
	/*
	*	Add an audio element into scene
	*/
	
	function addAudioToObject(scene, position, audioURI, volume, refDistance) {
		var sound = new THREE.Audio( listener );
		sound.load( audioURI );
		sound.setLoop(true);
		sound.setRefDistance( refDistance );
		sound.vr_originalVolume = volume;
		sound.setVolume(0);
		sound.position.set(position.x, position.y, position.z);
		sound.autoplay = true;
		scene.add( sound );
		scene.audioObjects.push(sound);
	}
	
	
}(SceneBuilder)); 