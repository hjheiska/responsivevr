/*
*	VRSceneModel
*	Acts as a state machine whose state can only be changed 
*	by from outside of the class by the following classes:
*
*	- VRDocumentParse: fills the model with objects according to
*	  the DOM structure of the web page.
*
*	- VRUserInput: Updates the HMD rotation quaternion and
*	  variables tracking mouse and keyboard events.
*
*	- VRGraphicsEngine: Updates the intersected objects
*	  array. 
*
*	- RemoteConnection: Updates the state according to state
*	  changes coming from an external network.	
*
*	State transitions are handled by calling the processLogic
*	function.
*
*	The state machine status is broadcast over an external
*	connection by using the RemoteConnection class.
*/

function VRSceneModel() {

	// Model state

	this.state = 
	{
		logicUpdate : false,
		elements : {
			links : [],
			articles : [],
			footer : null
		},
		navigation : 
		{	
			index : {
				nextIndex : null,
				currentIndex: [-1, 0],
				lastIndex: []
			},
			selections : {
				linkSelected : null,
				articleSelected : null,
				contentSelected: null,
				backSelected : null
			},
			hudVisible : true
		},
		inputDevices : 
		{
			local : {
				HMDs: [ {	x : 0, y : 0, z : 0, w : 1 } ],
				skeletons: [],
				keyboard : 
				{
					keysPressed : []
				},
				mouse : 
				{
					buttonDown : false
				}
			},
			remote : {
				HMDs: [ {	x : 0, y : 0, z : 0, w : 1 } ],
				skeletons: [],
				keyboard : 
				{
					keysPressed : []
				},
				mouse : 
				{
					buttonDown : false
				}
			}
		}
	}
	
	/*
	*	Logic loop
	*/
	setInterval(function(){ if(state) checkLogic(); }, 300);
	
	
	/*
	*	Functions to build the scene
	*/
	
	this.addLink = function(title, href, imageSource) { 
		var newLink = new Link(title, href, imageSource);
		this.state.elements.links.push(newLink); 
	}
	
	this.addArticle = function(title, contents, foregroundElementData, backgroundElementData) { 
		var newArticle = new Article(title, foregroundElementData, backgroundElementData);
		for(var i = 0; i < contents.length; i++) {
			var newContent = new Content(contents[i].text, contents[i].foregroundElementData, contents[i].backgroundElementData);
			newArticle.contents.push(newContent);
		}
		this.state.elements.articles.push(newArticle); 
	}
	
	this.addFooter = function(text, images) {
		var newFooter = new Footer(text);
		if(images) {
			for(var i = 0; i < images.length; i++) {
				var newImage = new Image(images[i].source);
				newFooter.images.push(newImage);
			}
		}
		this.state.elements.footer = newFooter;
	}
	
	/*
	*	State transition logic 
	*/
	var checkLogic = function() {
		
		if(state.navigation.selections.linkSelected != null) {
			var index = state.navigation.selections.linkSelected;
			var href = state.elements.links[index].href;
			getNewModel(href);
			state.navigation.selections.linkSelected = null;
		}
		
		if(state.navigation.selections.articleSelected != null) {
			var articleIndex = state.navigation.selections.articleSelected;
			var currentIndex = state.navigation.index.currentIndex;
			state.navigation.index.nextIndex = [articleIndex, -1];
			state.navigation.selections.articleSelected = null;
		}
		
		if(state.navigation.selections.contentSelected != null) {
			var contentIndex = state.navigation.selections.contentSelected;
			var currentIndex = state.navigation.index.currentIndex;
			state.navigation.index.nextIndex = [currentIndex[0], contentIndex];
			state.navigation.selections.contentSelected = null;
		}
		
		if(state.navigation.selections.backSelected != null) {
			if(state.navigation.index.lastIndex.length > 0) {
				state.navigation.index.currentIndex = state.navigation.index.lastIndex.pop();
				state.logicUpdate = true; 
			}
			state.navigation.selections.backSelected = null;
		}
		else if(state.navigation.index.nextIndex != null) {
			
			if(state.navigation.index.lastIndex.length > 0) {
				if(
					!(
					state.navigation.index.currentIndex[0] == state.navigation.index.nextIndex[0] &&
					state.navigation.index.currentIndex[1] == state.navigation.index.nextIndex[1]
					)
				) 
				{
					state.navigation.index.lastIndex.push(state.navigation.index.currentIndex);
				}
			}
			else {
				state.navigation.index.lastIndex.push(state.navigation.index.currentIndex);
			}
			state.navigation.index.currentIndex = state.navigation.index.nextIndex;
			state.logicUpdate = true; 
			state.navigation.index.nextIndex = null;
		}
	}
	
	var getNewModel = function(href) {
		console.log(href); // TODO
	}
	
	/*
	*	Content type declarations to keep data structures coherent
	*/
	function Link(title, href, imageSource) {
		this.text = title;
		this.href = href;
		this.image = new Image(imageSource);
	}
	
	function Article(title, foregroundElementData, backgroundElementData) {
		this.text = title;
		this.contents = []; // Array of content items
		this.foregroundElement = new AssociatedElement(foregroundElementData); 
		this.backgroundElement = new AssociatedElement(backgroundElementData);
	}
	
	function Footer(text, images) {
		this.text = text;
		this.images = [];
	}
	
	function Content(text, foregroundElementData, backgroundElementData) {
		this.text = text;
		this.foregroundElement = new AssociatedElement(foregroundElementData);
		this.backgroundElement = new AssociatedElement(backgroundElementData);
	}
	
	function AssociatedElement(data) {
		this.image = null;
		this.video = null;
		this.object = null;
		if(data) {
			if(data.image) this.image = new Image(data.image.source);
			if(data.video) this.video = new Video(data.video.source, data.video.width, data.video.height);
			if(data.object) this.object = new Object(data.object.source, data.object.scale, data.object.position, data.object.rotation);
		}
	}
	
	function Image(source) {
		this.source = source;
	}
	
	function Video(source, width, height) {
		this.source = source;
		this.width = width;
		this.height = height;
	}
	
	function Objec(source, scale, position, rotation) {
		this.source = source;
		this.scale = new Vector3D(scale.x, scale.y, scale.z);
		this.position = new Vector3D(position.x, position.y, position.z);
		this.rotation = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
	}
	
	function Vector3D(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
	
	function Quaternion(x, y, z, w) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
	
}
