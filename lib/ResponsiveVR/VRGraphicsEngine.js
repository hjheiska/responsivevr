
VRGraphicsEngine = {};
(function (VRGraphicsEngine, THREE, screen) {

	desktopRenderer = null;
	threeJsScene = null;
	camera = null;
	controls = null;
	
	// VR plane specifications (in meters)
	HUD_RADIUS = 1;
	HUD_Y_OFFSET = -0.2;
	HUD_DIMENSIONS = {
		content : {
			height: 0.3,
			width: 0.6,
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
	HUD_WIDTH_IN_PIXELS = 1200;
	TOTAL_HUD_HEIGHT = 
		HUD_DIMENSIONS.content.height + 
		HUD_DIMENSIONS.content.marginTop + 
		HUD_DIMENSIONS.content.marginBottom +
		HUD_DIMENSIONS.header.height +
		HUD_DIMENSIONS.footer.height;
	TOTAL_HUD_WIDTH = HUD_RADIUS * Math.PI * 2;
	hudAspectRatio = TOTAL_HUD_WIDTH / TOTAL_HUD_HEIGHT;
	HUD_HEIGHT_IN_PIXELS = HUD_WIDTH_IN_PIXELS / hudAspectRatio;
	
	VRGraphicsEngine.createCanvas = function(element) {
		
		desktopRenderer = new THREE.WebGLRenderer();
		desktopRenderer.setSize(screen.width, screen.height);
		desktopRenderer.setClearColor( 0xffffff, 1);
		element.appendChild(desktopRenderer.domElement);
		
		// Camera
		camera = new THREE.PerspectiveCamera(90, screen.width / screen.height, 0.1, 1000);
		camera.position.set(0,0,0.05);
		
		// Controls
		controls = new THREE.OrbitControls(camera, element);
	}
	
	VRGraphicsEngine.connectTo = function(sceneModel) {
		
		threeJsScene = new THREE.Scene();
		var links =  new THREE.Object3D(); links.name = "links";
		var articles =  new THREE.Object3D(); articles.name = "articles";
		var footer =  new THREE.Object3D(); footer.name = "footer";
		threeJsScene.add(links, articles, footer);
		threeJsScene.links = [];
		
		for(var i = 0; i < sceneModel.state.elements.links.length; i++) { 
			links.add(addLink(sceneModel.state.elements.links[i], i, sceneModel.state.elements.links.length)); 
		}
		for(var i = 0; i < sceneModel.state.elements.articles.length; i++) { 
			articles.add(addArticle(sceneModel.state.elements.articles[i], i, sceneModel.state.elements.articles.length)); 
		}
		footer.add(addFooter(sceneModel.state.elements.footer));
		
		// Hide/show objects according to modle sate
		checkVisibility(sceneModel, threeJsScene);
		
		
		// Lights, camera, action!
		threeJsScene.add( new THREE.AmbientLight( 0xffffff ) );
		threeJsScene.add(camera)
		animate();
		
		
		
		
	}
	
	var animate = function() {
		desktopRenderer.render(threeJsScene, camera);
		controls.update();
		requestAnimationFrame(animate);
	}
	
	var checkVisibility = function(sceneModel, threeJsScene) {
		var links = threeJsScene.getObjectByName( "links" ).children;
		var articles = threeJsScene.getObjectByName( "articles" ).children;
		var footer = threeJsScene.getObjectByName( "footer" );
		
		// Everything except hud toggle button if hud disabled
		if(!sceneModel.state.navigation.hudVisible)  {
			for(var i = 0; i < links.length; i++) links[i].visible = false;	
			for(var i = 0; i < articles.length; i++) articles[i].visible = false;	
			footer.visible = false;
		}
		else {
			// Always show links and footer in hud
			for(var i = 0; i < links.length; i++) links[i].visible = true;	
			footer.visible = true;
			
			var currentIndex = sceneModel.state.navigation.index.currentIndex[0];
			// If current index is 0, show all articles
			if(currentIndex == 0) {
				for(var i = 0; i < articles.length; i++) {
					articles[i].visible = true;	
					for(j = 0; j < articles[i].children.length; j++) {
						articles[i].children[j].visible = false;
					}
				}
			}
			else {
				// Otherwise only show content of currently selected article
				for(var i = 0; i < articles.length; i++) {
					if(currentIndex == articles[i].vr.index) { 
						articles[i].visible = true;
						for(j = 0; j < articles[i].children.length; j++) {
							articles[i].children[j].visible = true;
						}
					}
					else {
						articles[i].visible = false;
						for(j = 0; j < articles[i].children.length; j++) {
							articles[i].children[j].visible = false;
						}
					}
				}
			}
		}
	}	
	
	var addLink = function(element, elementIndex, numberOfElements)	{ 
		var linkObject = new THREE.Object3D();
		var linkWidth = HUD_DIMENSIONS.header.nav.width + HUD_DIMENSIONS.header.nav.marginLeftRight * 2;
		var linkHeight = HUD_DIMENSIONS.header.height;
		var contentHeight = HUD_DIMENSIONS.content.height + HUD_DIMENSIONS.content.marginTop;
		var linkYOffset = contentHeight + linkHeight / 2;
		var linkVisualAngle = getVisualAngle(linkWidth);
		setObjectPositionAndRotationOnCircle(linkObject, linkVisualAngle, HUD_RADIUS, linkWidth, linkYOffset, elementIndex, numberOfElements)
		linkObject.vr = {};
		linkObject.vr.index = elementIndex;
		linkObject.vr.element = element;
		
		addHudPlane(linkObject, HUD_DIMENSIONS.header.nav.width, HUD_DIMENSIONS.header.height, linkVisualAngle);
		makeObjectALink(linkObject);
		return linkObject;
	}
	
	var addArticle = function(element, elementIndex, numberOfElements)	{ 
		// 1. Add article
		var articleObject = new THREE.Object3D();
		var articleWidth = HUD_DIMENSIONS.content.width + HUD_DIMENSIONS.content.marginLeftRight * 2;
		var articleYOffset = 0;
		var articleVisualAngle = getVisualAngle(articleWidth);
		setObjectPositionAndRotationOnCircle(articleObject, articleVisualAngle, HUD_RADIUS, articleWidth, articleYOffset, elementIndex, numberOfElements)
		articleObject.vr = {};
		articleObject.vr.index = elementIndex;
		articleObject.vr.element = element;
		addHudPlane(articleObject, HUD_DIMENSIONS.content.width, HUD_DIMENSIONS.content.height, articleVisualAngle);
		makeObjectALink(articleObject);
		// 2. Add articles content
		for(var i = 0; i < element.contents.length; i++) {
			var contentObject = new THREE.Object3D();
			var contentVisualAngle = getVisualAngle(articleWidth);
			setObjectPositionAndRotationOnCircle(contentObject, contentVisualAngle, HUD_RADIUS, articleWidth, articleYOffset, i, element.contents.length);
			contentObject.vr = {};
			contentObject.vr.element = element.contents[i];
			contentObject.vr.index = i;
			addHudPlane(articleObject, HUD_DIMENSIONS.content.width, HUD_DIMENSIONS.content.height, contentVisualAngle);
			makeObjectALink(contentObject);
			articleObject.add(contentObject);
		}
		return articleObject;
	}
	var addFooter = function(element)	{ 
		var footerObject = new THREE.Object3D();
		var footerWidth = HUD_DIMENSIONS.footer.width;
		var footerHeight = HUD_DIMENSIONS.footer.height;
		var contentHeight = HUD_DIMENSIONS.content.height + HUD_DIMENSIONS.content.marginBottom;
		var footerYOffset = -(contentHeight + footerHeight / 2);
		var footerVisualAngle = getVisualAngle(footerWidth);
		setObjectPositionAndRotationOnCircle(footerObject, footerVisualAngle, footerWidth, footerYOffset, 0, 1);
		footerObject.vr = {};
		footerObject.vr.element = element;
		addHudPlane(footerObject, HUD_DIMENSIONS.footer.width, HUD_DIMENSIONS.footer.height, footerVisualAngle);
		return footerObject;
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
		var transparentMaterial = new THREE.MeshBasicMaterial( { color: 0xccccff, transparent: true, opacity: 0.75 } );
		var linkSphere = new THREE.Mesh( linkSphereGeom, transparentMaterial );
		linkSphere.position.set(Object3D.vr.width / 2, Object3D.vr.height / 2, 0);
		linkSphere.name = "linkSphere";
		Object3D.add(linkSphere);
	}
	
	
	var addHudPlane = function(Object3D, elementWidth, elementHeight, visualAngle) {
		var geometry = new THREE.CylinderGeometry( HUD_RADIUS, HUD_RADIUS, elementHeight, 8, 1, true, -visualAngle/2 + Math.PI, visualAngle); 
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		geometry.center();
		loadAndAddHTMLPlane(geometry, Object3D, elementWidth, elementHeight);
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
	
	
	
	var loadAndAddHTMLPlane = function(geometry, Object3D, elementWidth, elementHeight) {
		
		var elementWidthInPixels = HUD_WIDTH_IN_PIXELS * (elementWidth / TOTAL_HUD_WIDTH);
		var elementHeightInPixels = HUD_HEIGHT_IN_PIXELS * (elementHeight / TOTAL_HUD_HEIGHT);
		
		var style = 
			'background-color: lightblue;' +
			'opacity: 0.8;' +  
			'border-radius: 10px;' + 
			'margin: 0;' +
			'width: ' + elementWidthInPixels + 'px;' +
			'height: ' + elementHeightInPixels + 'px;' +
			'font-size: 20px;';
		
		var html = '<html><body style="margin: 0; padding; 0; position: relative"><div style="' + style + '">' + Object3D.vr.element.text + '</div></body></html>';
		console.log(html);
		rasterizeHTML.drawHTML(html).then(function (renderResult) {
			var canvas = document.createElement('canvas');
			canvas.width = elementWidthInPixels;
			canvas.height = elementHeightInPixels;
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
		});
	}
	
	
	var error = function(message) {
		console.log(message);
	}
	
}(VRGraphicsEngine, THREE, screen));