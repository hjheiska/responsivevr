
VRSceneBuilder = {};
(function (VRSceneBuilder, THREE) {

	VRSceneBuilder.objectsBeingLoaded = 0;
	
	// VR plane specifications (in meters)
	HUD_RADIUS = 1;
	HUD_Y_OFFSET = -0.2;
	HUD_DIMENSIONS = {
		content : {
			height: 0.6,
			width: 0.6,
			marginTop: 0.1,
			marginBottom: 0.1,
			marginLeftRight: 0.05	
		},
		header : {
			title: {
				width: 1.5,
				height: 0.1,
				marginBottom: 0.1
			},
			height: 0.1,
			nav :  {
				width: 0.3,
				marginLeftRight: 0.05
			}
		},
		footer : {
			height: 0.15,
			width: 1.5
		}
	}
	HUD_WIDTH_IN_PIXELS = 2400;
	TOTAL_HUD_HEIGHT = 
		HUD_DIMENSIONS.header.title.height +
		HUD_DIMENSIONS.content.height + 
		HUD_DIMENSIONS.content.marginTop + 
		HUD_DIMENSIONS.content.marginBottom +
		HUD_DIMENSIONS.header.height +
		HUD_DIMENSIONS.footer.height;
	TOTAL_HUD_WIDTH = HUD_RADIUS * Math.PI * 2;
	hudAspectRatio = TOTAL_HUD_WIDTH / TOTAL_HUD_HEIGHT;
	HUD_HEIGHT_IN_PIXELS = HUD_WIDTH_IN_PIXELS / hudAspectRatio;
	CONTENT_PLANE_WIDTH = 1.5;
	CONTENT_PLANE_WIDTH_IN_PIXELS = parseInt((CONTENT_PLANE_WIDTH / TOTAL_HUD_WIDTH) * HUD_WIDTH_IN_PIXELS);
	

	VRSceneBuilder.addLink = function(element, elementIndex, numberOfElements)	{ 
		var linkObject = new THREE.Object3D();
		var linkWidth = 
			HUD_DIMENSIONS.header.nav.width + 
			HUD_DIMENSIONS.header.nav.marginLeftRight * 2;
		var linkHeight = HUD_DIMENSIONS.header.height;
		var contentHeight = 
			(HUD_DIMENSIONS.content.height / 2) + 
			HUD_DIMENSIONS.content.marginTop;
		var linkYOffset = contentHeight + (linkHeight / 2);
		var linkVisualAngle = Utils.getVisualAngle(linkWidth, HUD_RADIUS);
		setObjectPositionAndRotationOnCircle(
			linkObject, 
			linkVisualAngle, 
			linkWidth, 
			linkYOffset, 
			elementIndex, 
			numberOfElements
		);
		linkObject.vr = {};
		linkObject.vr.index = elementIndex;
		linkObject.vr.element = element;
		linkObject.vr.type = "link";
		linkObject.vr.width = HUD_DIMENSIONS.header.nav.width;
		linkObject.vr.height =  HUD_DIMENSIONS.header.height;
		
		addHudPlane(linkObject, linkObject.vr.width, linkObject.vr.height);
		VRGraphicsEngine.makeObjectALink(linkObject);
		return linkObject;
	}
	
	
	VRSceneBuilder.addArticle = function(element, elementIndex, numberOfElements)	{ 
		// 1. Add article
		var articleObject = new THREE.Object3D();
		var articleWidth = HUD_DIMENSIONS.content.width + HUD_DIMENSIONS.content.marginLeftRight * 2;
		var articleYOffset = 0;
		var articleVisualAngle = Utils.getVisualAngle(articleWidth, HUD_RADIUS);
		setObjectPositionAndRotationOnCircle(
			articleObject, 
			articleVisualAngle, 
			articleWidth, 
			articleYOffset, 
			elementIndex, 
			numberOfElements
		);
		articleObject.vr = {};
		articleObject.vr.index = elementIndex;
		articleObject.vr.element = element;
		articleObject.vr.type = "article";
		articleObject.vr.width = HUD_DIMENSIONS.content.width;
		articleObject.vr.height = HUD_DIMENSIONS.content.height;
		
		addHudPlane(articleObject, articleObject.vr.width, articleObject.vr.height);
		VRGraphicsEngine.makeObjectALink(articleObject);
		// 2. Add articles content
		for(var i = 0; i < element.contents.length; i++) {
			var contentObject = new THREE.Object3D();
			var contentVisualAngle = Utils.getVisualAngle(articleWidth, HUD_RADIUS);
			setObjectPositionAndRotationOnCircle(
				contentObject, 
				contentVisualAngle, 
				articleWidth, 
				articleYOffset, 
				i, 
				element.contents.length
			);
			contentObject.vr = {};
			contentObject.vr.element = element.contents[i];
			contentObject.vr.index = i;
			contentObject.vr.type = "content";
			contentObject.vr.width = HUD_DIMENSIONS.content.width;
			contentObject.vr.height = HUD_DIMENSIONS.content.height;
			contentObject.vr.element.text = 
				'<div style="padding: 10px">' + contentObject.vr.element.text + '</div>';
			addHudPlane(
				contentObject, 
				contentObject.vr.width, 
				contentObject.vr.height, 
				contentVisualAngle
			);
			VRGraphicsEngine.makeObjectALink(contentObject);
			
			var contentArray = articleObject.getObjectByName("contents");
			if(!contentArray) {
				contentArray = new THREE.Object3D();
				contentArray.name = "contents";
				
				contentArray.position.sub(
					new THREE.Vector3(0,0,-1).multiplyScalar(
						articleObject.position.length()
					)
				);
				contentArray.rotation.set(0,-articleObject.rotation.y,0, 'XYZ');
				articleObject.add(contentArray);
			}
			contentArray.add(contentObject);
		}
		return articleObject;
	}
	VRSceneBuilder.addFooter = function(element)	{ 
		var footerObject = new THREE.Object3D();
		var footerWidth = HUD_DIMENSIONS.footer.width;
		var footerHeight = HUD_DIMENSIONS.footer.height;
		var contentHeight = (HUD_DIMENSIONS.content.height / 2) + HUD_DIMENSIONS.content.marginBottom;
		var footerYOffset = -contentHeight - (footerHeight / 2);
		var footerVisualAngle = Utils.getVisualAngle(footerWidth, HUD_RADIUS);
		setObjectPositionAndRotationOnCircle(
			footerObject, 
			footerVisualAngle, 
			footerWidth, 
			footerYOffset, 
			0, 
			1
		);
		footerObject.vr = {};
		footerObject.vr.element = element;
		footerObject.vr.type = "footer";
		footerObject.vr.width = HUD_DIMENSIONS.footer.width;
		footerObject.vr.height = HUD_DIMENSIONS.footer.height;
		addHudPlane(footerObject, HUD_DIMENSIONS.footer.width, HUD_DIMENSIONS.footer.height);
		return footerObject;
	}
	
	VRSceneBuilder.addHeader = function(element)	{ 
		var headerObject = new THREE.Object3D();
		var headerWidth = HUD_DIMENSIONS.header.title.width;
		var headerHeight = HUD_DIMENSIONS.header.title.height;
		var contentHeight = (HUD_DIMENSIONS.content.height / 2) + HUD_DIMENSIONS.content.marginTop;
		var linkHeight = HUD_DIMENSIONS.header.height + HUD_DIMENSIONS.header.title.marginBottom;
		var headerYOffset = contentHeight  + linkHeight + ( headerHeight / 2);
		var headerVisualAngle = Utils.getVisualAngle(headerWidth, HUD_RADIUS);
		
		setObjectPositionAndRotationOnCircle(
			headerObject, 
			headerVisualAngle, 
			headerWidth, 
			headerYOffset, 
			0, 
			1
		);
		headerObject.vr = {};
		headerObject.vr.element = element;
		headerObject.vr.type = "header";
		headerObject.vr.width = HUD_DIMENSIONS.header.title.width;
		headerObject.vr.height = HUD_DIMENSIONS.header.title.height;
		addHudPlane(headerObject, HUD_DIMENSIONS.header.title.width, HUD_DIMENSIONS.header.title.height);
		return headerObject;
	}
	
	var setObjectPositionAndRotationOnCircle = function(
			Object3D, 
			elementVisualAngle, 
			elementWidth, 
			elementYOffset, 
			index, 
			numberOfElements) 
	{
		// X and Z coordinates
		var data = Utils.getXYPositionAndRotationOnCircle(elementVisualAngle, index, numberOfElements, HUD_RADIUS);
		// Rotation
		Object3D.rotation.copy(new THREE.Euler(0, data.rotation, 0, "XYZ"));
		Object3D.position.copy(new THREE.Vector3(data.x, elementYOffset, -data.z));
	}
	
	var addHudPlane = function(Object3D, elementWidth, elementHeight) {
		var visualAngle = Utils.getVisualAngle(elementWidth, HUD_RADIUS);
		var geometry = new THREE.CylinderGeometry( 
			HUD_RADIUS, 
			HUD_RADIUS, 
			elementHeight, 
			16, 
			1, 
			true, 
			-visualAngle/2 + Math.PI, 
			visualAngle); 
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		geometry.center();
		loadAndAddmesh(geometry, Object3D, elementWidth, elementHeight);
	}
	
	
	var loadAndAddmesh = function(geometry, Object3D, elementWidth, elementHeight) {
		
		var elementWidthInPixels = parseInt(HUD_WIDTH_IN_PIXELS * (elementWidth / TOTAL_HUD_WIDTH));
		var elementHeightInPixels = parseInt(HUD_HEIGHT_IN_PIXELS * (elementHeight / TOTAL_HUD_HEIGHT));
		
		var isContentElement = (Object3D.vr.element.constructor == VRSceneModel.Content);
		
		var style = 
			'background-color: black;' +
			'color: white;' +
			'opacity: 0.8;' +  
			'border-radius: 10px;' + 
			'margin: 0;' +
			'padding: 0;' +
			'width: ' +  elementWidthInPixels + 'px;' +
			'height: ' + elementHeightInPixels + 'px;';
			
		var imageSource = "";
		if(typeof Object3D.vr.element.foregroundElement != 'undefined') {
			if(Object3D.vr.element.foregroundElement.image != null) {
				 imageSource = Object3D.vr.element.foregroundElement.image.source;
			}
		}
		var textStyle = "";
		if(!imageSource && !isContentElement) {
			var textStyle = 
				'position: relative;' +
				'top: ' +  ((elementHeightInPixels / 2) - 10) + "px;";
		}
		
		if(imageSource || !isContentElement) {
			style += 'text-align: center;' 
			style += 'font-size: 20px;';
		}
		else {
			style += 'font-size: 18px;';
			style += 'text-align: justify;';
			style += 'box-sizing: border-box;';
		}
		
		
		var menuText = "<div style='" + textStyle + "'>" + Object3D.vr.element.text + "</div>";
		if(imageSource) { 
			if(isContentElement) {
				menuText = 
				"<span style=' display: inline-block; height: 100%; vertical-align: middle;'>" + 
				"</span><img style='display: inline-block; vertical-align: middle; max-width:" 
				+ elementWidthInPixels + "px; max-height:" + elementHeightInPixels + "px' src='" +  imageSource + "' />";
			}
			else {
				menuText = "<img style='max-width:" + elementWidthInPixels + "px; max-height:" 
				+ (elementHeightInPixels - 40) + "px' src='" +  imageSource + "' />" + menuText;
			}
		}
		var html = 
			'<html><body style="margin: 0; padding: 0; width: ' + elementWidthInPixels + 'px; height: ' + 
			elementHeightInPixels + 'px"><div style="' + style + '">' + menuText + '</div></body></html>';
		
		var mesh = new THREE.Object3D();
		mesh.name = "mesh";
		Object3D.add(mesh);	
		VRSceneBuilder.objectsBeingLoaded++;
		
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
			VRSceneBuilder.objectsBeingLoaded--;			
		});
	}
	
	VRSceneBuilder.handleContentPlane = function(element, contentPlane) {
		var contentPlaneMesh = contentPlane.getObjectByName("mesh");
		if(contentPlaneMesh) contentPlane.remove(contentPlaneMesh);
		// Add content plane
		contentPlane.vr = {};
		contentPlane.vr.element = new VRSceneModel.Content(element.text);

		var imageSource = "";
		if(typeof element.foregroundElement != 'undefined') {
			if(element.foregroundElement.image != null) {
				 imageSource = element.foregroundElement.image.source;
			}
		}
		
		contentPlane.vr.element.text = 
			'<div style="-moz-column-count: 2; -webkit-column-count: 2; font-size: 18px;' + 
			'padding: 10px; box-sizing: border-box; width: ' + CONTENT_PLANE_WIDTH_IN_PIXELS + 
			'px">' + contentPlane.vr.element.text + '</div>';
		
		var dimensions = Utils.getMarkupRenderedSize(contentPlane.vr.element.text); 
		var contentPlaneHeight = (dimensions.height / HUD_HEIGHT_IN_PIXELS) * TOTAL_HUD_HEIGHT;
		
		contentPlane.position.setY(-(contentPlaneHeight / 5));
		
		var visualAngle = Utils.getVisualAngle(CONTENT_PLANE_WIDTH, HUD_RADIUS);
		var geometry = new THREE.CylinderGeometry( 
			HUD_RADIUS, 
			HUD_RADIUS, 
			contentPlaneHeight, 
			8, 
			1, 
			true, 
			-visualAngle/2 + Math.PI, visualAngle
		); 
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		geometry.center();
		
		contentPlane.visible = true;
		loadAndAddmesh(geometry, contentPlane, CONTENT_PLANE_WIDTH, contentPlaneHeight);
	}
	
	VRSceneBuilder.loadAndAddObject = function(type, src, scene) {
		VRSceneBuilder.objectsBeingLoaded++;
		src = src.toString();
		var loader = new THREE.OBJMTLLoader();
		switch(type) {
			case "objmtl":
				var loader = new THREE.OBJMTLLoader();
				var objURI = src.split("|")[0];
				var mtlURI = src.split("|")[1];
				loader.load( objURI, mtlURI, 
					function ( object ) {
						scene.add(object);
						VRSceneBuilder.objectsBeingLoaded--;
				});
			break;
		}
	}	
	
}(VRSceneBuilder, THREE));