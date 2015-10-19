
VRGraphicsEngine = {};
(function (VRGraphicsEngine, THREE, screen) {
	VRIsSupported = navigator.mozGetVRDevices || navigator.getVRDevices;
	
	desktopRenderer = null;
	VRRenderer = null;
	renderer = null;
	
	threeJsScene = null;
	sceneModel = null;
	camera = null;
	controls = null;
	raycaster = new THREE.Raycaster();
	linkObjects = [];
	videoObjects = [];
	backgroundVideoSphereTexture = null;
	cursorSphere = null;
	backgroundSphere = null;
	
	var activeMenuItem = {
		object: null,
		selectionStartTime: 0
	}

	// VR plane specifications (in meters)
	HUD_RADIUS = 1;
	HUD_Y_OFFSET = -0.2;
	HUD_DIMENSIONS = {
		content : {
			height: 0.3,
			width: 0.3,
			marginTop: 0.1,
			marginBottom: 0.1,
			marginLeftRight: 0.05	
		},
		header : {
			title: {
				width: 1.5,
				height: 0.2,
				marginBottom: 0.1
			},
			height: 0.1,
			nav :  {
				width: 0.3,
				marginLeftRight: 0.05
			}
		},
		footer : {
			height: 0.2,
			width: 1.5
		}
	}
	HUD_WIDTH_IN_PIXELS = 2400;
	TOTAL_HUD_HEIGHT = 
		HUD_DIMENSIONS.content.height + 
		HUD_DIMENSIONS.content.marginTop + 
		HUD_DIMENSIONS.content.marginBottom +
		HUD_DIMENSIONS.header.height +
		HUD_DIMENSIONS.footer.height;
	TOTAL_HUD_WIDTH = HUD_RADIUS * Math.PI * 2;
	hudAspectRatio = TOTAL_HUD_WIDTH / TOTAL_HUD_HEIGHT;
	HUD_HEIGHT_IN_PIXELS = HUD_WIDTH_IN_PIXELS / hudAspectRatio;
	
	MENU_SELECTION_DELAY = 1000;
	MENU_ITEM_SCALE_CHANGE = 1.3;

	HOME_PAGE_COLOR = 0xffffff;
	
	VRGraphicsEngine.createCanvas = function(element) {
		
		desktopRenderer = new THREE.WebGLRenderer();
		desktopRenderer.setSize(screen.width, screen.height);
		desktopRenderer.setClearColor( 0x000000, 1);
		
		VRRenderer = new THREE.VREffect(desktopRenderer);
		VRRenderer.setSize(screen.width, screen.height);
		if(VRIsSupported) renderer = VRRenderer;
		else renderer = desktopRenderer;
		desktopRenderer.domElement.style.display = "none";
		
		element.appendChild(desktopRenderer.domElement);
		Utils.addFullscreenLink(desktopRenderer);
		
		// Camera
		camera = new THREE.PerspectiveCamera(90, screen.width / screen.height, 0.1, 1000);
		camera.position.set(0,0,0.05);
		
		// Controls
		if(VRIsSupported) controls = new THREE.VRControls(camera);
		else controls = new THREE.OrbitControls(camera, desktopRenderer.domElement);
		
		var fullScreenChange = desktopRenderer.domElement.mozRequestFullScreen ? 'mozfullscreenchange' : 'webkitfullscreenchange';
		document.addEventListener( fullScreenChange, onFullScreenChanged, false );
		function onFullScreenChanged() {
			if(VRIsSupported) VRRenderer.setFullScreen(false);
			// Fullscreen switched off
			if ( !document.mozFullScreenElement && !document.webkitFullscreenElement ) {
				desktopRenderer.domElement.style.display = "none";
			}
		}
	}
	
	VRGraphicsEngine.connectTo = function(model) {
		
		threeJsScene = new THREE.Scene();
		sceneModel = model;
		var header = new THREE.Object3D(); header.name = "header";
		var links =  new THREE.Object3D(); links.name = "links";
		var articles =  new THREE.Object3D(); articles.name = "articles";
		var footer =  new THREE.Object3D(); footer.name = "footer";
		threeJsScene.add(header, links, articles, footer);
		threeJsScene.links = [];
		
		header.add(addHeader(sceneModel.state.elements.header));
		
		for(var i = 0; i < sceneModel.state.elements.links.length; i++) { 
			links.add(addLink(sceneModel.state.elements.links[i], i, sceneModel.state.elements.links.length)); 
		}
		for(var i = 0; i < sceneModel.state.elements.articles.length; i++) { 
			articles.add(addArticle(sceneModel.state.elements.articles[i], i, sceneModel.state.elements.articles.length)); 
		}
		footer.add(addFooter(sceneModel.state.elements.footer));
		
		
		var redMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.5, depthTest: false } );
		var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, transparent: true, opacity: 0.5, depthTest: false } );
		var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.5, depthTest: false } );
		// Add cursor sphere object for menu selection
		var cursorSphereGeom =  new THREE.SphereGeometry( 0.01, 10, 10 );
		cursorSphere = new THREE.Mesh( cursorSphereGeom, redMaterial );
		cursorSphere.name="cursorSphere";
		cursorSphere.originalScale = 0.01;
		
		// Add back and toggle hud spheres
		var navSphereGeom =  new THREE.SphereGeometry( 0.1, 10, 10 );
		var backSphere =  new THREE.Object3D()
		backSphereMesh = new THREE.Mesh( navSphereGeom, blueMaterial );
		backSphereMesh.name="mesh";
		backSphere.add(backSphereMesh);
		backSphere.position.set(-0.25,-0.7,-1);
		backSphere.name="backSphere";
		backSphere.vr = {};
		backSphere.vr.type = "back";
		
		var toggleHudSphere =  new THREE.Object3D()
		toggleHudSphereMesh = new THREE.Mesh( navSphereGeom, greenMaterial );
		toggleHudSphereMesh.name="mesh";
		toggleHudSphere.add(toggleHudSphereMesh);
		toggleHudSphere.position.set(0.25,-0.7,-1);
		toggleHudSphere.name = "toggleHudSphere";
		toggleHudSphere.vr = {};
		toggleHudSphere.vr.type = "toggleHud";
		threeJsScene.add(backSphere, toggleHudSphere);
		makeObjectALink(backSphere);
		makeObjectALink(toggleHudSphere);
		
		// Add background sphere
		var geometry = new THREE.SphereGeometry( 900, 64, 32 );
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );	
		var material = new THREE.MeshBasicMaterial( {color: HOME_PAGE_COLOR} );
		backgroundSphere = new THREE.Mesh( geometry,  material );
		backgroundSphere.name = "backgroundSphere";
		backgroundSphere.rotation.set(0, -Math.PI / 2, 0, 'XYZ');
		threeJsScene.add(backgroundSphere);
		
		// Hide/show objects according to model sate
		checkVisibility();
		
		// Lights, camera, action!
		threeJsScene.add( new THREE.AmbientLight( 0xffffff ) );
		threeJsScene.add(camera)
		animate();
	}
	
	activateFullscreen = function() {
		desktopRenderer.domElement.style.display = "block";
		if(VRIsSupported) {
			VRRenderer.setFullScreen(true);
		}
		else {
			if ( desktopRenderer.domElement.mozRequestFullScreen ) {
				desktopRenderer.domElement.mozRequestFullScreen();
			} else if ( desktopRenderer.domElement.webkitRequestFullscreen ) {
				desktopRenderer.domElement.webkitRequestFullscreen();
			}
		}
		
	}
	
	
	
	var resetView = function() {
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
		}, function() { });
	}

	var animate = function() {
		
		var indexOfReset = sceneModel.state.inputDevices.local.keyboard.keysPressed.indexOf(122);
		if(indexOfReset > -1)  {
			sceneModel.state.inputDevices.local.keyboard.keysPressed.splice(indexOfReset, 1);
			resetView();
			console.log("Resetting");
		}
		
		
		renderer.render(threeJsScene, camera);
		if(sceneModel.state.logicUpdate) {
			sceneModel.state.logicUpdate = false;
			checkVisibility();
		}
		if(backgroundVideoSphereTexture) {
			
			if(backgroundVideoSphereTexture.vr.video.paused) backgroundVideoSphereTexture.vr.video.play();
			if ( backgroundVideoSphereTexture.vr.video.readyState === backgroundVideoSphereTexture.vr.video.HAVE_ENOUGH_DATA ) {
				backgroundVideoSphereTexture.vr.context.drawImage( backgroundVideoSphereTexture.vr.video, 0, 0 );
				backgroundVideoSphereTexture.needsUpdate = true;	
			}
		}
		handleSelection();
		controls.update();
		requestAnimationFrame(animate);
	}
	var handleSelection = function() {
		raycaster.setFromCamera( new THREE.Vector2(0, 0), camera );	
		var intersects = raycaster.intersectObjects( linkObjects, false ); 
		
		var d = new Date(); 
		var currentTime = d.getTime();
		
		var selectedObject = null;
		var intersectionPoint = null;
		MENU_ITEM_SCALE_CHANGE = 1.3;
		MENU_SELECTION_DELAY;
		
		if(intersects.length > 0) {
			for(var i = 0; i < intersects.length; i++) {
				if(intersects[i].object.parent.getObjectByName("mesh").visible) {
					selectedObject = intersects[i].object;
					intersectionPoint = intersects[i].point;
					break;
				}
			}
		}
		
		if(selectedObject == null) {
			if(activeMenuItem.object != null) {
				activeMenuItem.object.scale.divideScalar(MENU_ITEM_SCALE_CHANGE);
				var cursor = threeJsScene.getObjectByName("cursorSphere");
				if(cursor) threeJsScene.remove(cursor);
				cursorSphere.material.color.setHex(0xff0000);
				cursorSphere.scale.set(1,1,1);
			}
			activeMenuItem.object = null;
			activeMenuItem.selectionStartTime = 0;
		}
		else if(activeMenuItem.object != selectedObject) {
			if(activeMenuItem.object != null) activeMenuItem.object.scale.divideScalar(MENU_ITEM_SCALE_CHANGE);
			selectedObject.linkTriggered = false;
			cursorSphere.position.set(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
			threeJsScene.add(cursorSphere);
			selectedObject.scale.multiplyScalar(MENU_ITEM_SCALE_CHANGE);
			activeMenuItem.object = selectedObject;
			activeMenuItem.selectionStartTime = currentTime;
		}
		else if(activeMenuItem.object == selectedObject) {
			cursorSphere.position.set(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
			var selectionProgress = currentTime - activeMenuItem.selectionStartTime;
			var colorPercentage = (selectionProgress /  MENU_SELECTION_DELAY);
			
			
			if(selectionProgress > MENU_SELECTION_DELAY) {
				if(!selectedObject.linkTriggered) {
					triggerAction(activeMenuItem.object.parent);
					selectedObject.linkTriggered = true;
					//cursorMaterial.color.setRGB(1,0,1);
				}
	
			}
			else {
				var cursorScale = (1 + colorPercentage * 5);
				cursorSphere.scale.set(cursorScale, cursorScale, cursorScale);
				cursorSphere.material.color.setRGB(1 - colorPercentage,colorPercentage,0);
			}
		}
			
	}
	
	var triggerAction = function(Object3D) {

		switch(Object3D.vr.type) {
			case "link":
				sceneModel.state.navigation.selections.linkSelected = Object3D.vr.index;
			break;
			case "article":
				sceneModel.state.navigation.selections.articleSelected = Object3D.vr.index;
			break;
			case "content":
				sceneModel.state.navigation.selections.contentSelected = Object3D.vr.index;
			break;
			case "toggleHud":
				sceneModel.state.navigation.hudVisible = !sceneModel.state.navigation.hudVisible;
				checkVisibility();
			break;
			case "back":
				sceneModel.state.navigation.selections.backSelected = true;
			break;
			
		}
		
	}
	
	var checkVisibility = function() {
		
		var links = threeJsScene.getObjectByName( "links" ).children;
		var articles = threeJsScene.getObjectByName( "articles" ).children;
		var footer = threeJsScene.getObjectByName( "footer" );
		
		// Everything except hud toggle button if hud disabled
		if(!sceneModel.state.navigation.hudVisible)  {
			for(var i = 0; i < links.length; i++) hideShowObjectAndContents(links[i], false, false, -1, -1);	
			for(var i = 0; i < articles.length; i++) hideShowObjectAndContents(articles[i], false, false, -1, -1);	
			footer.visible = false;
		}
		else {
			// Always show links and footer in hud
			for(var i = 0; i < links.length; i++) hideShowObjectAndContents(links[i], true, true, -1, -1);	
			footer.visible = true;
			var currentArticleIndex = sceneModel.state.navigation.index.currentIndex[0];
			var currentContentIndex = sceneModel.state.navigation.index.currentIndex[1];
			// If current index is -1, show all articles
			if(currentArticleIndex == -1) {
				for(var i = 0; i < articles.length; i++) {
					hideShowObjectAndContents(articles[i], true, false, -1, -1);
					handleBackgroundForeground(null); // Reset background sphere
				}
			}
			else {
				// Otherwise, if -1 content index, show content of currently selected article
				// if not -1, show the selected content
				for(var i = 0; i < articles.length; i++) {
					if(currentArticleIndex == articles[i].vr.index) hideShowObjectAndContents(articles[i], false, true, currentContentIndex, currentArticleIndex);
					else hideShowObjectAndContents(articles[i], false, false, currentContentIndex, currentArticleIndex);
				}
			}
		}
	}	
	
	var hideShowObjectAndContents = function(object, showObject, showContents, currentContentIndex, currentArticleIndex) {
		setObjectVisibility(object, showObject);
		if(object.vr.type == "article" && object.vr.index == currentArticleIndex) activateArticle(object.vr.element);
		var contents = object.getObjectByName("contents");
		if(contents) {
			for(j = 0; j < contents.children.length; j++) {
				if(showContents && (currentContentIndex == -1 || currentContentIndex == j)) {
					if(currentContentIndex != -1 && contents.children[j].vr.type == "content") {
						activateContent(contents.children[j].vr.element);
					}
					setObjectVisibility(contents.children[j], true);
				}
				else {
					setObjectVisibility(contents.children[j], false);
				}
			}
		}
	}
	
	var setObjectVisibility = function(object, isVisible) {
		var objectMesh = object.getObjectByName("mesh");
		var objectLinkSphere = object.getObjectByName("linkSphere");
		objectMesh.visible = isVisible;
		objectLinkSphere.visible = isVisible;
	}
	
	var activateArticle = function(article) {
		handleBackgroundForeground(article);
	}
	var activateContent = function(content) {
		handleBackgroundForeground(content);
	}
	
	var handleBackgroundForeground = function(element) {
		
		// Foreground
		// TODO
		
		// Background
		if(backgroundVideoSphereTexture) {
			backgroundVideoSphereTexture.vr.video.pause();
			backgroundVideoSphereTexture = null;
		}
		if(element) {
			if(element.backgroundElement.image) {
				var newTexture = THREE.ImageUtils.loadTexture( element.backgroundElement.image.source );
				newTexture.minFilter = THREE.LinearFilter;
				backgroundSphere.material = new THREE.MeshBasicMaterial( {map: newTexture } );
			}
			else if(element.backgroundElement.video) {
				var videoWidthInPixels = element.backgroundElement.video.width;
				var videoHeightInPixels = element.backgroundElement.video.height;
				var videoTexture = Utils.getVideoTexture(element.backgroundElement.video.source, videoWidthInPixels, videoHeightInPixels);
				backgroundSphere.material = new THREE.MeshBasicMaterial( {map: videoTexture, overdraw: true} );
				backgroundVideoSphereTexture = videoTexture;
			}
			else {
				backgroundSphere.material = new THREE.MeshBasicMaterial( {color: HOME_PAGE_COLOR} );
			}
		}
		else { 
			backgroundSphere.material = new THREE.MeshBasicMaterial( {color: HOME_PAGE_COLOR} );
		}
		// TODO: Object background
	}
	
	var addHudToggleSphere = function(scene) {
		var hudToggleSphere =  new THREE.Object3D()
		hudToggleSphere.vr.type = "hudToggle";
		makeObjectALink(hudToggleSphere);
		scene.add(hudToggleSphere);
	}
	var addLink = function(element, elementIndex, numberOfElements)	{ 
		var linkObject = new THREE.Object3D();
		var linkWidth = HUD_DIMENSIONS.header.nav.width + HUD_DIMENSIONS.header.nav.marginLeftRight * 2;
		var linkHeight = HUD_DIMENSIONS.header.height;
		var contentHeight = (HUD_DIMENSIONS.content.height / 2) + HUD_DIMENSIONS.content.marginTop;
		var linkYOffset = contentHeight + (linkHeight / 2);
		var linkVisualAngle = getVisualAngle(linkWidth);
		setObjectPositionAndRotationOnCircle(linkObject, linkVisualAngle, linkWidth, linkYOffset, elementIndex, numberOfElements)
		linkObject.vr = {};
		linkObject.vr.index = elementIndex;
		linkObject.vr.element = element;
		linkObject.vr.type = "link";
		linkObject.vr.width = HUD_DIMENSIONS.header.nav.width;
		linkObject.vr.height =  HUD_DIMENSIONS.header.height;
		
		addHudPlane(linkObject, linkObject.vr.width, linkObject.vr.height);
		makeObjectALink(linkObject);
		return linkObject;
	}
	
	var addArticle = function(element, elementIndex, numberOfElements)	{ 
		// 1. Add article
		var articleObject = new THREE.Object3D();
		var articleWidth = HUD_DIMENSIONS.content.width + HUD_DIMENSIONS.content.marginLeftRight * 2;
		var articleYOffset = 0;
		var articleVisualAngle = getVisualAngle(articleWidth);
		setObjectPositionAndRotationOnCircle(articleObject, articleVisualAngle, articleWidth, articleYOffset, elementIndex, numberOfElements)
		articleObject.vr = {};
		articleObject.vr.index = elementIndex;
		articleObject.vr.element = element;
		articleObject.vr.type = "article";
		articleObject.vr.width = HUD_DIMENSIONS.content.width;
		articleObject.vr.height = HUD_DIMENSIONS.content.height;
		
		addHudPlane(articleObject, articleObject.vr.width, articleObject.vr.height);
		makeObjectALink(articleObject);
		// 2. Add articles content
		for(var i = 0; i < element.contents.length; i++) {
			var contentObject = new THREE.Object3D();
			var contentVisualAngle = getVisualAngle(articleWidth);
			setObjectPositionAndRotationOnCircle(contentObject, contentVisualAngle, articleWidth, articleYOffset, i, element.contents.length);
			contentObject.position.sub(new THREE.Vector3(0,0,-1).multiplyScalar(articleObject.position.length()));
			
			contentObject.vr = {};
			contentObject.vr.element = element.contents[i];
			contentObject.vr.index = i;
			contentObject.vr.type = "content";
			contentObject.vr.width = HUD_DIMENSIONS.content.width;
			contentObject.vr.height = HUD_DIMENSIONS.content.height;
			addHudPlane(contentObject, contentObject.vr.width, contentObject.vr.height, contentVisualAngle);
			makeObjectALink(contentObject);
			
			var contentArray = articleObject.getObjectByName("contents");
			if(!contentArray) {
				contentArray = new THREE.Object3D();
				contentArray.name = "contents";
				articleObject.add(contentArray);
			}
			contentArray.add(contentObject);
			
			
		}
		return articleObject;
	}
	var addFooter = function(element)	{ 
		var footerObject = new THREE.Object3D();
		var footerWidth = HUD_DIMENSIONS.footer.width;
		var footerHeight = HUD_DIMENSIONS.footer.height;
		var contentHeight = (HUD_DIMENSIONS.content.height / 2) + HUD_DIMENSIONS.content.marginBottom;
		var footerYOffset = -contentHeight - (footerHeight / 2);
		var footerVisualAngle = getVisualAngle(footerWidth);
		setObjectPositionAndRotationOnCircle(footerObject, footerVisualAngle, footerWidth, footerYOffset, 0, 1);
		footerObject.vr = {};
		footerObject.vr.element = element;
		footerObject.vr.type = "footer";
		footerObject.vr.width = HUD_DIMENSIONS.footer.width;
		footerObject.vr.height = HUD_DIMENSIONS.footer.height;
		addHudPlane(footerObject, HUD_DIMENSIONS.footer.width, HUD_DIMENSIONS.footer.height);
		return footerObject;
	}
	
	var addHeader = function(element)	{ 
		var headerObject = new THREE.Object3D();
		var headerWidth = HUD_DIMENSIONS.header.title.width;
		var headerHeight = HUD_DIMENSIONS.header.title.height;
		var contentHeight = (HUD_DIMENSIONS.content.height / 2) + HUD_DIMENSIONS.content.marginTop;
		var linkHeight = HUD_DIMENSIONS.header.height + HUD_DIMENSIONS.header.title.marginBottom;
		var headerYOffset = contentHeight  + linkHeight + ( headerHeight / 2);
		var headerVisualAngle = getVisualAngle(headerWidth);
		
		setObjectPositionAndRotationOnCircle(headerObject, headerVisualAngle, headerWidth, headerYOffset, 0, 1);
		headerObject.vr = {};
		headerObject.vr.element = element;
		headerObject.vr.type = "header";
		headerObject.vr.width = HUD_DIMENSIONS.header.title.width;
		headerObject.vr.height = HUD_DIMENSIONS.header.title.height;
		addHudPlane(headerObject, HUD_DIMENSIONS.header.title.width, HUD_DIMENSIONS.header.title.height);
		return headerObject;
	}
	
	var setObjectPositionAndRotationOnCircle = function(Object3D, elementVisualAngle, elementWidth, elementYOffset, index, numberOfElements) {
		// X and Z coordinates
		var data = getXYPositionAndRotationOnCircle(elementVisualAngle, index, numberOfElements);
		// Rotation
		Object3D.rotation.copy(new THREE.Euler(0, data.rotation, 0, "XYZ"));
		Object3D.position.copy(new THREE.Vector3(data.x, elementYOffset, -data.z));
	}
	
	var getXYPositionAndRotationOnCircle = function(elementVisualAngle, elementIndex, numberOfElements) {
		var angleOffsetFromCenter = (numberOfElements / 2) * elementVisualAngle;
		var elementAngleOffsetFromLeft = (elementIndex * elementVisualAngle) + (elementVisualAngle / 2);
		var elementAngle = -angleOffsetFromCenter + elementAngleOffsetFromLeft;
		var xzPositionAndRotation = {
			z : Math.cos(elementAngle) * HUD_RADIUS,
			x : Math.sin(elementAngle) * HUD_RADIUS,
			rotation: -elementAngle + (2 * Math.PI)
		}
		return xzPositionAndRotation;
	}
	
	var getVisualAngle = function(elementWidth) {
		var circumference = HUD_RADIUS * Math.PI * 2;
		var visualAngle = (elementWidth / circumference) * Math.PI * 2;
		return visualAngle;
	}
	
	
	var makeObjectALink = function(Object3D) {
		var linkSphereGeom =  new THREE.SphereGeometry( 0.05, 20, 10 );
		var transparentMaterial = new THREE.MeshBasicMaterial( { color: 0x0000cc, transparent: true, opacity: 0.75 } );
		var linkSphere = new THREE.Mesh( linkSphereGeom, transparentMaterial );
		if(typeof Object3D.vr.width == 'undefined')  
			linkSphere.position.set(0, 0, 0);
		else
			linkSphere.position.set(Object3D.vr.width / 2, Object3D.vr.height / 2, 0);
		
		linkSphere.name = "linkSphere";
		linkObjects.push(linkSphere);
		Object3D.add(linkSphere);
	}
	
	
	var addHudPlane = function(Object3D, elementWidth, elementHeight) {
		var visualAngle = getVisualAngle(elementWidth);
		var geometry = new THREE.CylinderGeometry( HUD_RADIUS, HUD_RADIUS, elementHeight, 8, 1, true, -visualAngle/2 + Math.PI, visualAngle); 
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		geometry.center();
		loadAndAddmesh(geometry, Object3D, elementWidth, elementHeight);
	}
	
	var makeElementALink = function(Object3D) {
		var objectDimensions = new THREE.Box3().setFromObject(Object3D).size().width
		var linkSphere = new THREE.Mesh( 
			new THREE.SphereGeometry( 0.05, 20, 10 ), 
			new THREE.MeshBasicMaterial( { color: 0xccccff, transparent: true, opacity: 0.75 } ) 
		);
		linkSphere.position.set(objectDimensions.width / 2, objectDimensions.height / 2, 0);
		Object3D.add(linkSphere);
		threeJsScene.links.push(linkSphere);	
	}
	
	
	
	var loadAndAddmesh = function(geometry, Object3D, elementWidth, elementHeight) {
		
		var elementWidthInPixels = HUD_WIDTH_IN_PIXELS * (elementWidth / TOTAL_HUD_WIDTH);
		var elementHeightInPixels = HUD_HEIGHT_IN_PIXELS * (elementHeight / TOTAL_HUD_HEIGHT);
		
		var style = 
			'background-color: black;' +
			'color: white;' +
			'opacity: 0.8;' +  
			'text-align: center;' +  
			'border-radius: 10px;' + 
			'margin: 0;' +
			'width: ' + parseInt(elementWidthInPixels) + 'px;' +
			'min-height: ' + parseInt(elementHeightInPixels) + 'px;' +
			'font-size: 20px;' +
			'height: 30px';
		
		var html = '<html><body style="margin: 0; padding; 0; position: relative"><div style="' + style + '">' + Object3D.vr.element.text + '</div></body></html>';
	
		var mesh = new THREE.Object3D();
		mesh.name = "mesh";
		Object3D.add(mesh);	
		
		rasterizeHTML.drawHTML(html).then(function (renderResult) {
			var canvas = document.createElement('canvas');
			canvas.width = elementWidthInPixels;
			canvas.height = elementHeightInPixels;
			var context = canvas.getContext('2d');
			context.drawImage(renderResult.image, 0, 0);
			var dynamicTexture = new THREE.Texture(canvas);
			dynamicTexture.minFilter = THREE.NearestFilter;
			dynamicTexture.needsUpdate = true;
			var material = new THREE.MeshBasicMaterial( { 
			  transparent: true, 
			  side: THREE.DoubleSide,
			  map: dynamicTexture
			});
			var plane = new THREE.Mesh( geometry, material );
			mesh.add(plane);	
		}, function() { });
	}
	
	
	var error = function(message) {
		console.log(message);
	}
	
}(VRGraphicsEngine, THREE, screen));