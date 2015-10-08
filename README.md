# responsivevr
Responsive VR

Responsive VR is a project that aims to create a temporary solution for making web pages to smoothly display their content when viewed both in a regular 2D desktop mode as well as in a 3D virtual reality WebVR mode.

This is achieved by first parsing the HTML to created an abstract scene model. The scene model can then be manipulated by user input or through incoming data from a WebSocket or WebRTC connection. Finally, the model is displayed using a graphics engine such as the THREE.js (WebGL).

Currently this project includes code from the following outside libraries:
- Text-to-speech support by ResponsiveVoice.JS (http://responsivevoice.org)
- HTML rasterizer by rasterizeHTML.js (http://cburgmer.github.io/rasterizeHTML.js)
- JQuery: https://jquery.com/
- THREE.js: http://threejs.org/

This project is very much still a work in progress, so not much to see here yet.