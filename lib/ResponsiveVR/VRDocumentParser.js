
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
			var foregroundElementData = null; // TODO: Implement
			var backgroundElementData = null; // TODO: Implement
			// Content information
			var contents = [];
			for(var j = 0; j < pTags.length; j++) {
				var text = getText(pTags[j]);
				var newContent = {
					text : text,
					foregroundElementData : null, // TODO: Implement
					backgroundElementData : null // TODO: Implement
				}
				contents.push(newContent);	
			}
			sceneModel.addArticle(title, contents, foregroundElementData, backgroundElementData)
		}
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

