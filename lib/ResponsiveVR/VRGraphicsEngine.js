
VRGraphicsEngine = {};
(function (VRGraphicsEngine, THREE, screen) {

	desktopRenderer = null;
	threeJsScene = null;
	
	// VR plane specifications (in meters)
	HUD_RADIUS = 1;
	HUD_HEIGHT = 1;
	HUD_Y_OFFSET = -0.2;
	HUD_DIMENSIONS = {
		content : {
			height: 0.3,
			width: 0.3,
			marginTop: 0.1,
			marginBottom: 0.1,
			marginLeftRight: 0.2	
		},
		header : {
			height: 0.2,
			nav :  {
				width: 0.3,
				marginLeftRight: 0.1
			}
		},
		footer : {
			height: 0.2,
			width: 0.5
		}
	}
	
	
	VRGraphicsEngine.createCanvas = function(element) {
		
		desktopRenderer = new THREE.WebGLRenderer();
		desktopRenderer.setSize(screen.width, screen.height);
		desktopRenderer.setClearColor( 0xffffff, 1);
		console.log(element);
		element.appendChild(desktopRenderer.domElement);
		
	}
	
	VRGraphicsEngine.connectTo = function(sceneModel) {
		
		threeJsScene = new THREE.Scene();
		var links =  new THREE.Object3D(); links.name = "links";
		var articles =  new THREE.Object3D(); articles.name = "articles";
		var footer =  new THREE.Object3D(); footer.name = "footer";
		threeJsScene.add(links, articles, footer);
		
		for(var i = 0; i < sceneModel.state.elements.links.length; i++) { 
			links.add(addLink(sceneModel.state.elements.links[i], i, sceneModel.state.elements.links.length)); 
		}
		for(var i = 0; i < sceneModel.state.elements.articles.length; i++) { 
			articles.add(addArticle(sceneModel.state.elements.articles[i], i, sceneModel.state.elements.articles.length)); 
		}
		footer.add(addFooter(sceneModel.state.elements.footer));
		
		
	}
	
	var addLink = function(element, elementIndex, numberOfElements)	{ 
		var linkObject = new THREE.Object3D();
		var linkWidth = HUD_DIMENSIONS.header.nav.width + HUD_DIMENSIONS.header.nav.marginLeftRight * 2;
		var linkHeight = HUD_DIMENSIONS.header.height;
		var contentHeight = HUD_DIMENSIONS.content.height + HUD_DIMENSIONS.content.marginTop;
		var linkYOffset = contentHeight + linkHeight / 2;
		setObjectPositionAndRotationOnCircle(linkObject, HUD_RADIUS, linkWidth, linkYOffset, elementIndex, numberOfElements)
		linkObject.vr = {};
		linkObject.vr.index = elementIndex;
		linkObject.vr.href = element.href;
		makeObjectALink(linkObject, linkWidth, linkHeight);
		return linkObject;
	}
	
	var addArticle = function(element, elementIndex, numberOfElements)	{ 
		// 1. Add article
		var articleObject = new THREE.Object3D();
		var articleWidth = HUD_DIMENSIONS.content.width + HUD_DIMENSIONS.content.marginLeftRight * 2;
		var articleYOffset = 0;
		setObjectPositionAndRotationOnCircle(articleObject, HUD_RADIUS, articleWidth, articleYOffset, elementIndex, numberOfElements)
		articleObject.vr = {};
		articleObject.vr.index = elementIndex;
		//makeObjectALink(linkObject, linkWidth, linkHeight);
		return articleObject;
		
		articleObject.vr.contents = [];
		// 2. Add articles content
		for(var i = 0; i < element.contents.length; i++) {
			var contentObject = new THREE.Object3D();
			setObjectPositionAndRotationOnCircle(contentObject, HUD_RADIUS, articleWidth, yOffset, i, element.contents.length);
			contentObject.vr.index = i;
		}
	}
	var addFooter = function(element)	{ 
		var footerObject = new THREE.Object3D();
		var footerWidth = HUD_DIMENSIONS.footer.width;
		var footerHeight = HUD_DIMENSIONS.footer.height;
		var contentHeight = HUD_DIMENSIONS.content.height + HUD_DIMENSIONS.content.marginBottom;
		var footerYOffset = - (contentHeight + footerHeight / 2);
		setObjectPositionAndRotationOnCircle(footerObject, footerWidth, footerYOffset, 0, 1);
		return footerObject;
	}
	
	var setObjectPositionAndRotationOnCircle = function(Object3D, elementWidth, elementYOffset, index, numberOfElements) {
		// X and Z coordinates
		var elementVisualAngle = getVisualAngle(elementWidth);
		var xzCoordinates = getXYPositionOnCircle(elementVisualAngle, index, numberOfElements);
		// Rotation
		var rotation = -elementVisualAngle + (2 * Math.PI);
		Object3D.rotation.copy(new THREE.Euler(0, rotation, 0, "XYZ"));
		Object3D.position.copy(new THREE.Vector3(xzCoordinates.x, elementYOffset, -xzCoordinates.z));
	}
	
	var getXYPositionOnCircle = function(elementVisualAngle, elementIndex, numberOfElements) {
		var angleOffsetFromCenter = (numberOfElements / 2) * elementVisualAngle;
		var elementAngleOffsetFromLeft = (elementIndex * elementVisualAngle + elementVisualAngle / 2);
		var elementAngle = angleOffsetFromCenter + elementAngleOffsetFromLeft;
		var xzCoordinates = {
			z : Math.cos(elementAngle) * HUD_RADIUS,
			x : Math.sin(elementAngle) * HUD_RADIUS
		}
		return xzCoordinates;
	}
	
	var getVisualAngle = function(elementWidth) {
		var circumference = HUD_RADIUS * Math.PI * 2;
		var visualAngle = (elementWidth / circumference) * Math.PI * 2;
		return visualAngle;
	}
	
	
	var makeObjectALink = function(Object3D) {
		var linkSphereGeom =  new THREE.SphereGeometry( 0.05, 20, 10 );
		var transparentMaterial = new THREE.MeshBasicMaterial( { color: 0xccccff, transparent: true, opacity: 0.75 } );
		var linkSphere = new THREE.Mesh( linkSphereGeom, transparentMaterial );
		linkSphere.position.set(Object3D.vr.width / 2, Object3D.vr.height / 2, 0);
		linkSphere.name = "linkSphere";
		Object3D.add(linkSphere);
	}
	
	
	var addHudPlane = function() {
		
		var geometry = new THREE.CylinderGeometry( HUD_RADIUS, HUD_RADIUS, Object3D.height, 8, 1, true, -angle/2 + Math.PI, angle); 
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		geometry.center();
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
	
	/*
	
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
	*/
	
	var error = function(message) {
		console.log(message);
	}

}(VRGraphicsEngine, THREE, screen));