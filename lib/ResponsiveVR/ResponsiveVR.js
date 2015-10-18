/*
*	ResponsiveVR
*	The main class. Starts the following processes:
*	
*	1. Parses the DOM of the document and creates a VRScene
*	2. Initiates VRInput event loops
*	3. Initiates VRGraphicsEngine animation loop
*/

ResponsiveVR = {};
(function (	
	ResponsiveVR, 
	VRSceneModel,
	VRDocumentParser,
	VRGraphicsEngine,
	VRUserInput,
	window, 
	screen, 
	navigator) 
{

	var sceneModel = new VRSceneModel();
	
	ResponsiveVR.init = function() {
		// 1. Parse DOM and create the scene
		VRDocumentParser.initScene(sceneModel, window.document); 

		// 2. Connect user input into the scene
		VRUserInput.connectTo(sceneModel, window.document);
		
		// 3. Add canvas to the web page and connect 
		//    graphics engine to the scene model
		VRGraphicsEngine.createCanvas(window.document.body);
		VRGraphicsEngine.connectTo(sceneModel);
		
		// 4. Initiate remote connection to sync model state
		//RemoteConnection.connectTo(sceneModel);
	}
	
}(	ResponsiveVR, 
	VRSceneModel,
	VRDocumentParser,
	VRGraphicsEngine,
	VRUserInput,
	window, 
	screen, 
	navigator));





