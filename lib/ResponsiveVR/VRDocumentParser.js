
/*
*	VRDocumentParser
*	Constructs a VRSceneModel from the DOM of the web page
*	
*/

VRDocumentParser = {};
(function (VRDocumentParser) {
	
	VRDocumentParser.initScene = function(sceneModel, document) {
		var HEADER = document.getElementsByTagName("HEADER")[0];
		var SECTION = document.getElementsByTagName("SECTION")[0];
		var FOOTER = document.getElementsByTagName("FOOTER")[0];
		parseHEADER(HEADER, sceneModel);
		parseSECTION(SECTION, sceneModel);
		parseFOOTER(FOOTER, sceneModel);
	}
	
	var parseHEADER = function(HEADER, sceneModel) {
		var ulTag = HEADER.getElementsByTagName("UL")[0];
		var liTags = ulTag.getElementsByTagName("LI");
		for(var i = 0; i < liTags.length; i++) {
			var aTag = liTags[i].getElementsByTagName("A")[0];
			var title = getText(aTag);
			var href = Utils.getStringAttribute(aTag, "HREF", "");
			var linkIndex = i;
			var image = null; // TODO: Implement
			sceneModel.addLink(title, href, image); 
		}
	}
	
	var parseSECTION = function(SECTION, sceneModel) {
		var articleTags = SECTION.getElementsByTagName("ARTICLE");
		for(var i = 0; i < articleTags.length; i++) {
			var headerTag = articleTags[i].getElementsByTagName("HEADER")[0];
			var h2Tag = headerTag.getElementsByTagName("H2")[0];
			var pTags = articleTags[i].getElementsByTagName("P");
			// Article information
			var title = getText(h2Tag);
			var foregroundElementData = getElementImage(headerTag);
			var backgroundElementData = getElementBackgroundSphere(articleTags[i]);
			// Content information
			var contents = [];
			for(var j = 0; j < pTags.length; j++) {
				var text = getText(pTags[j]);
				var newContent = {
					text : text,
					foregroundElementData : getElementImage(pTags[j]),
					backgroundElementData : getElementBackgroundSphere(pTags[j])
				}
				contents.push(newContent);	
			}
			sceneModel.addArticle(title, contents, foregroundElementData, backgroundElementData)
		}
	}
	
	var getElementImage = function(element) {
		var image = element.getElementsByTagName("IMG")[0];
		var data = null;
		if(image) {
			data = {
				image: {
					source : Utils.getStringAttribute(image, "src", "")
				}
			}
		}
		return data;
	}
	
	var getElementBackgroundSphere = function(element) {
		
		var imageSrc = Utils.getStringAttribute(element, "imageSphere", "");
		var videoSrc = Utils.getStringAttribute(element, "videoSphere", "");
		var videoWidth = Utils.getStringAttribute(element, "videoWidthInPixels", "");
		var videoHeight = Utils.getStringAttribute(element, "videoHeightInPixels", "");
		
		var data = {};
		if(imageSrc != "") {
			data.image = {}
			data.image.source = imageSrc;
		}
		if(videoSrc != "") {
			data.video = {}
			data.video.source = videoSrc;
			data.video.width = videoWidth;
			data.video.height = videoHeight;
		}
		
		return data;
	}
	
	var parseFOOTER = function(FOOTER, sceneModel) {
		var text = getText(FOOTER);
		var images = null; // TODO: Implement
		sceneModel.addFooter(text, images);
	}
	
	var getText = function(element) {
		return element.innerText || element.textContent;
	}
	
}(VRDocumentParser));

