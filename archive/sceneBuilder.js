/*
*	SceneBuilder:
*	Builds a ThreeJS scene
*/

SceneBuilder = {}; 	
(function (SceneBuilder, THREE) {
	
	// VR plane specifications
	hudRadius = 1;
	hudHeight = 1;
	hudYOffset = -0.2;
	hudDimensions = {
		content : {
			height: 100,
			width: 110,
			marginTop: 20,
			marginBottom: 20,
			marginLeftRight: 10	
		},
		header : {
			height: 25,
			nav :  {
				width: 90,
				marginLeftRight: 10
			}
		},
		footer : {
			height: 50,
			width: 200
		}
	}
	
	objectsLoading = 0;
	
	SceneBuilder.isLoadingScene = function() {
		if(objectsLoading > 0) return true;
		else return false;
	}
	
	SceneBuilder.createANewScene = function() {
		var scene = new THREE.Scene();
		scene.vr = {};
		scene.vr.objects = [];
		scene.vr.linkObjects = [];
		scene.vr.videoObjects = [];
		return scene;
	}
	SceneBuilder.addLink = function(scene, linkIndex, href, title)	{ 
		if(typeof scene.vr.objects["links"] === 'undefined') scene.vr.objects["links"] = [];
		var linkObject = new THREE.Object3D();
		linkObject.vr = {};
		linkObject.vr.HTMLcontent = '<div style="text-align: center">' + title + '</div>';
		linkObject.vr.href = href;
		linkObject.vr.type = "link";
		linkObject.vr.linkTriggered = false;
		scene.vr.objects["links"].push(linkObject);
	}
	SceneBuilder.addArticle = function(scene, articleIndex, articleTitle, articlePhoto, backgroundSphere) { 
		if(typeof scene.vr.objects["articles"] === 'undefined') scene.vr.objects["articles"] = [];
		var articleObject = new THREE.Object3D();
		articleObject.vr = {};
		articleObject.vr.HTMLcontent = '';
		if(articlePhoto) articleObject.vr.HTMLcontent += '<div style="text-align: center;"><img style="max-height: ' + (hudDimensions.content.height * 0.8) + 'px" src="' + articlePhoto + '" /></div>';
		articleObject.vr.HTMLcontent += '<div style="position: absolute; bottom: 0"><div style="text-align: center; width: ' + hudDimensions.content.width + 'px">' + articleTitle + '</div></div>';
		articleObject.vr.type = "article";
		articleObject.vr.linkTriggered = false;
		articleObject.vr.index = articleIndex;
		articleObject.vr.opened = false;
		addBackgroundSphereInformation(articleObject, backgroundSphere, scene);
		scene.vr.objects["articles"][articleIndex] = articleObject;
	}
	
	
	SceneBuilder.addParagraph = function(scene, articleIndex, paragraphContent, backgroundSphere, contentImage) { 
		if(typeof scene.vr.objects["content"] === 'undefined') {
			scene.vr.objects["content"] = [];
		}
		if(typeof scene.vr.objects["content"][articleIndex] === 'undefined') {
			scene.vr.objects["content"][articleIndex] = [];
		}
		var contentObject = new THREE.Object3D();
		contentObject.vr = {};
		contentObject.visible = false;
		contentObject.vr.articleIndex = articleIndex;
		contentObject.vr.contentIndex = scene.vr.objects["content"][articleIndex].length;
		
		if(contentImage) 
			contentObject.vr.HTMLcontent = '<div style="text-align: center;"><img style="max-height: ' + (hudDimensions.content.height) + 'px; max-width: ' + (hudDimensions.content.width) + 'px" src="' + contentImage + '" />' + paragraphContent + '</div>';
		else
			contentObject.vr.HTMLcontent = paragraphContent;
			
		contentObject.vr.type = "content";
		addBackgroundSphereInformation(contentObject, backgroundSphere, scene);
		contentObject.vr.linkTriggered = false;
		scene.vr.objects["content"][articleIndex].push(contentObject);
	}
	SceneBuilder.addFooter = function(scene, footerContent) { 
		var footerObject = new THREE.Object3D();
		footerObject.vr = {};
		footerObject.vr.HTMLcontent = '<div style="text-align: center;">' +footerContent + '</div>';
		footerObject.vr.type = "footer";
		footerObject.vr.linkTriggered = false;
		scene.vr.objects["footer"] = footerObject;
	}
	
	SceneBuilder.buildScene = function(scene) {
		
		// Calculate hud overall dimensions in pixels
		var hudHeightInPixels = 0;
		hudHeightInPixels += hudDimensions.content.height;
		hudHeightInPixels += hudDimensions.content.marginTop;
		hudHeightInPixels += hudDimensions.content.marginBottom;
		hudHeightInPixels += hudDimensions.header.height;
		hudHeightInPixels += hudDimensions.footer.height;
		var hudWidthInPixels = hudHeightInPixels * (Math.PI * 2 * hudRadius / hudHeight);
		
		// Calculate offsets and dimensions for elements
		var articleOffsetAndDimensions = calculateAngleOffsetAndDimensions(hudDimensions.content.width, hudDimensions.content.height, hudDimensions.content.marginLeftRight, hudWidthInPixels, hudHeightInPixels, hudHeight, hudRadius, scene.vr.objects["articles"].length);
		var articleContentAngleOffsets = [];
		for(var i = 0; i < scene.vr.objects["articles"].length; i++) {
			articleContentAngleOffsets[i] = calculateAngleOffsetAndDimensions(hudDimensions.content.width, hudDimensions.content.height, hudDimensions.content.marginLeftRight, hudWidthInPixels, hudHeightInPixels, hudHeight, hudRadius, scene.vr.objects["content"][i].length);
		}
		var linkOffsetAndDimensions = calculateAngleOffsetAndDimensions(hudDimensions.header.nav.width, hudDimensions.header.height, hudDimensions.header.nav.marginLeftRight, hudWidthInPixels, hudHeightInPixels, hudHeight, hudRadius, scene.vr.objects["links"].length);
		var footerOffsetAndDimensions = calculateAngleOffsetAndDimensions(hudDimensions.footer.width, hudDimensions.footer.height, 0, hudWidthInPixels, hudHeightInPixels, hudHeight, hudRadius, 1);
	
		// Add plane objects
		// 1. Article boxes
		for(var i = 0; i < scene.vr.objects["articles"].length; i++) {
			var yOffset = 0;
			setObjectParameters(scene.vr.objects["articles"][i], articleOffsetAndDimensions, i, yOffset);
			scene.add(scene.vr.objects["articles"][i]);
			addHudPlane(scene,scene.vr.objects["articles"][i], articleOffsetAndDimensions.anglePerElementWithoutMargin, true);
			// 2. Article content boxes
			for(var j = 0; j < scene.vr.objects["content"][i].length; j++) {
				var yOffset = 0;
				setObjectParameters(scene.vr.objects["content"][i][j], articleContentAngleOffsets[i], j, yOffset);
				scene.add(scene.vr.objects["content"][i][j]);
				addHudPlane(scene,scene.vr.objects["content"][i][j], articleContentAngleOffsets[i].anglePerElementWithoutMargin, true);
			}
		}
		// 3. Links
		for(var i = 0; i < scene.vr.objects["links"].length; i++) {
			var yOffset = ((hudDimensions.content.height / 2) + hudDimensions.content.marginTop + (hudDimensions.header.height / 2)) / hudHeightInPixels * hudHeight;
			setObjectParameters(scene.vr.objects["links"][i], linkOffsetAndDimensions, i, yOffset);
			scene.add(scene.vr.objects["links"][i]);
			addHudPlane(scene,scene.vr.objects["links"][i], linkOffsetAndDimensions.anglePerElementWithoutMargin, true);
		}
		// 4. Footer
		var yOffset = ((-hudDimensions.content.height / 2) - hudDimensions.content.marginBottom - (hudDimensions.footer.height / 2)) / hudHeightInPixels * hudHeight;
		setObjectParameters(scene.vr.objects["footer"], footerOffsetAndDimensions, 0, yOffset);
		scene.add(scene.vr.objects["footer"]);
		addHudPlane(scene,scene.vr.objects["footer"], footerOffsetAndDimensions.anglePerElementWithoutMargin, false);
			
	}	
	
	var addBackgroundSphereInformation = function(object, backgroundSphere, scene) {
		if(backgroundSphere.video.source) {
				
			var videoSources = backgroundSphere.video.source.split("|");
			var videoWidths =backgroundSphere.video.widthInPixels.toString().split("|");
			var videoHeights = backgroundSphere.video.heightInPixels.toString().split("|");
			
			// Check if using Google Chrome browser
			if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
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
			object.vr.videoElement = video;
			object.vr.videoContext = videoImageContext;
			object.vr.videoTexture = videoTexture;
			object.vr.backgroundSphereTexture = videoTexture;
			scene.vr.videoObjects.push(object);
		}
		else if(backgroundSphere.image.source) {
			var backgroundSphereTexture = THREE.ImageUtils.loadTexture( backgroundSphere.image.source );
			backgroundSphereTexture.minFilter = THREE.LinearFilter;
			object.vr.backgroundSphereTexture = backgroundSphereTexture;
		}
		else {
			object.vr.backgroundSphereTexture = null;
		}
	}
	
	var setObjectParameters = function(Object3D, elementOffsetAndDimensions, index, yOffset) {
			var angle = -elementOffsetAndDimensions.angleOffsetFromCenter + (index * elementOffsetAndDimensions.anglePerElementWithMargin) + (elementOffsetAndDimensions.anglePerElementWithMargin / 2);
			var z = Math.cos(angle) * hudRadius;
			var x = Math.sin(angle) * hudRadius;
			var rotation = -angle + 2 * Math.PI;
			Object3D.rotation.copy(new THREE.Euler(0, rotation, 0, "XYZ"));
			Object3D.position.copy(new THREE.Vector3(x, yOffset, -z));
			Object3D.vr.height = elementOffsetAndDimensions.elementRealHeight;
			Object3D.vr.width = elementOffsetAndDimensions.elementRealWidth;
			Object3D.vr.heightInPixels = elementOffsetAndDimensions.elementHeightInPixels;
			Object3D.vr.widthInPixels = elementOffsetAndDimensions.elementWidthInPixels;
			Object3D.vr.index = index;		
	}
	
	var calculateAngleOffsetAndDimensions = function(elementWidthInPixels, elementHeightInPixels, elementMarginInPixels, hudWidthInPixels, hudHeightInPixels, hudHeight, hudRadius, numberOfElements) {
		var anglePerElementWithMargin = 2 * Math.PI * (elementWidthInPixels + (elementMarginInPixels * 2)) / hudWidthInPixels;
		var anglePerElementWithoutMargin = 2 * Math.PI * elementWidthInPixels / hudWidthInPixels;
		var offsetAndDimensions = 
		{
			anglePerElementWithMargin : anglePerElementWithMargin,
			anglePerElementWithoutMargin : anglePerElementWithoutMargin,
			angleOffsetFromCenter : (numberOfElements / 2) * anglePerElementWithMargin,
			elementRealHeight : elementHeightInPixels / hudHeightInPixels * hudHeight,
			elementRealWidth : hudRadius * Math.sin(anglePerElementWithoutMargin / 2) * 2,
			elementWidthInPixels : elementWidthInPixels,
			elementHeightInPixels : elementHeightInPixels
		}
		return offsetAndDimensions;
	}
	
	SceneBuilder.addLights = function(scene) {
		var ambient = new THREE.AmbientLight( 0xffffff );
		scene.add( ambient );
	}		
	
	var addHudPlane = function(scene, Object3D, angle, isALink) {
		//var geometry = new THREE.PlaneGeometry( Object3D.vr.width, Object3D.vr.height, 1 );
		var geometry = new THREE.CylinderGeometry( hudRadius, hudRadius, Object3D.vr.height, 8, 1, true, -angle/2 + Math.PI, angle); 
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		geometry.center();
		Object3D.position.add(new THREE.Vector3(0, hudYOffset, 0));
		loadAndAddHTMLPlane(geometry, Object3D);
		
		if(isALink) {
			var linkSphereGeom =  new THREE.SphereGeometry( 0.05, 20, 10 );
			var transparentMaterial = new THREE.MeshBasicMaterial( { color: 0xccccff, transparent: true, opacity: 0.75 } );
			var linkSphere = new THREE.Mesh( linkSphereGeom, transparentMaterial );
			linkSphere.position.set(Object3D.vr.width / 2, Object3D.vr.height / 2, 0);
			linkSphere.name = "linkSphere";
			scene.vr.linkObjects.push(linkSphere);
			Object3D.add(linkSphere);
		}
		
	}
	
	var loadAndAddHTMLPlane = function(geometry, Object3D) {
		var style = ''
		style += 'background-color: lightblue;' 
		style += 'opacity: 0.8;' 
		style += 'border-radius: 10px;' 
		style += 'margin: 0;';
		style += 'width: ' + (Object3D.vr.widthInPixels) + 'px;';
		style += 'height: ' + (Object3D.vr.heightInPixels) + 'px;';
		style += 'font-size: 20px;';
		
		var html = '<html><body style="margin: 0; padding; 0; position: relative"><div style="' + style + '">' + Object3D.vr.HTMLcontent + '</div></body></html>';
		objectsLoading++;
		rasterizeHTML.drawHTML(html).then(function (renderResult) {
			var canvas = document.createElement('canvas');
			canvas.width = Object3D.vr.widthInPixels;
			canvas.height = Object3D.vr.heightInPixels;
			var context = canvas.getContext('2d');
			context.drawImage(renderResult.image, 0, 0);
			var dynamicTexture = new THREE.Texture(canvas);
			dynamicTexture.needsUpdate = true;
			var material = new THREE.MeshBasicMaterial( { 
			  transparent: true, 
			  side: THREE.DoubleSide,
			  map: dynamicTexture
			});
			var plane = new THREE.Mesh( geometry, material );
			Object3D.add(plane);
			objectsLoading--;
		});
	}

	SceneBuilder.addCursor = function(scene, cursor) {
		cursor.visible = false;
		scene.add(cursor);
	}
	
	SceneBuilder.addBackgroundSphere = function(scene, photoSphere) {
		scene.add(photoSphere);
	}
	
	 SceneBuilder.getCursorSphere = function() {
		var cursorGeom =  new THREE.SphereGeometry( 0.01, 10, 10 );
		var cursorMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.5 } );
		var cursor = new THREE.Mesh( cursorGeom, cursorMaterial );
		cursor.name="cursor";
		cursor.originalScale = 0.01;
		return cursor;
	}
	
	SceneBuilder.getBackgroundSphere = function(scene) {
		var geometry = new THREE.SphereGeometry( 5000, 64, 32 );
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		var material = new THREE.MeshBasicMaterial();		
		var photoSphere = new THREE.Mesh( geometry, material );
		photoSphere.rotation.set(0,-Math.PI/2,0);
		return photoSphere;
	}
	
	SceneBuilder.getDesktopRenderer = function(containerWidth, containerHeight) {
		var desktopRenderer = new THREE.WebGLRenderer();
		desktopRenderer.setSize(containerWidth, containerHeight);
		desktopRenderer.setClearColor( 0xffffff, 1);
		return desktopRenderer;
	}
	
	SceneBuilder.getVRRenderer = function(desktopRenderer) {
		var VRRenderer = new THREE.VREffect(desktopRenderer);
		return VRRenderer;	
	}
	
	SceneBuilder.getCamera = function(fov, aspectRatio) {
		var camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 10000);
		camera.position.set(0,0,0.05);
		return camera;
	}
	
	SceneBuilder.changePhotoSphere = function(photoSphere, photoSphereTexture) {
	
		var material = new THREE.MeshBasicMaterial( {
		  map: photoSphereTexture,
		  side: THREE.FrontSide
		} );
		
		photoSphere.material = material;
	}
	
	SceneBuilder.resetPhotoSphere = function(photoSphere) {
		var material = new THREE.MeshBasicMaterial();		
		photoSphere.material = material;
	}
	
	SceneBuilder.getControls = function(camera, element, VRIsSupported) {
		var controls = null;
		
		if(VRIsSupported)
			var controls = new THREE.VRControls(camera);
		else
			var controls = new THREE.OrbitControls(camera, element);
			
		return controls;
	}
	SceneBuilder.getRayCaster = function() {
		return new THREE.Raycaster();
	}
	
	SceneBuilder.getIntersects = function(raycaster, camera, scene, objects) {
		raycaster.setFromCamera( new THREE.Vector2(0, 0), camera );	
		var intersects = raycaster.intersectObjects( objects, false );
		return intersects;
	}
	
}(SceneBuilder, THREE));	
