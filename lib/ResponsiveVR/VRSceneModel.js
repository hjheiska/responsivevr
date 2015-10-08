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
		elements : {
			links : [],
			articles : [],
			footer : null
		},
		navigation : 
		{	
			index : {
				nextIndex : null,
				currentIndex: [0, 0],
				lastIndex: null
			},
			selections : {
				linkSelected : null,
				articleSelected : null,
				contentSelected: null,
				backSelected : null
			}
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
	*	Functions to build the scene
	*/
	
	this.addLink = function(title, href, imageSource) { 
		var newLink = new Link(title, href, imageSource);
		this.state.elements.links.push(newLink); 
	}
	
	this.addArticle = function(title, contents, foregroundElementData, backgroundElementData) { 
		var newArticle = new Article(title, foregroundElementData, backgroundElementData);
		for(var i = 0; i < contents.length; i++) {
			var newContent = new Content(contents[i].text, contents.foregroundElementData, contents.backgroundElementData);
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
	*	Content type declarations to keep data structures coherent
	*/
	function Link(title, href, imageSource) {
		this.title = title;
		this.href = href;
		this.image = new Image(imageSource);
	}
	
	function Article(title, foregroundElementData, backgroundElementData) {
		this.title = title;
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
			if(data.video) this.video = new Video(data.video.source);
			if(data.object) this.object = new Object(data.image.source, data.image.scale, data.image.position, data.image.rotation);
		}
	}
	
	function Image(source) {
		this.source = source;
	}
	
	function Video(source) {
		this.source = source;
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
