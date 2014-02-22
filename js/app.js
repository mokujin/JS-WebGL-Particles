// --------------------------------------------------------------- BEGIN INIT STUFF ----------------------------
var w, h, gl, canvas;
var requestAnimationFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
window.onload = main;
var stats = new Stats();

function initGL()
{
	console.log("start initializing WebGL :|");

	gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
	
	if(!gl)	console.error("fail to init webgl :(");
	else console.info("webgl is ok :)");

	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	//gl.enable(gl.DEPTH_TEST);
	//gl.depthFunc(gl.LEQUAL);                             

	console.log("WebGL initialization finished successfully)");

}

// --------------------------------------------------------------- END INIT STUFF ----------------------------

// ---------------------------------------------------------------------- MAIN ----------------------
var particleWorld;
var emitter;
function main () {
	// Align top-left
	stats.setMode(0);
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild( stats.domElement );

	canvas = document.getElementById("cnvs");
	initGL();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	particleWorld = new ParticleWorld(gl);

	var bank = new ParticleBank(particleWorld, 500000 /* buf size */, 100000/* lifetime */, loadProgram (gl, "shader-vs", "shader-fs" ));

	var pos = {x:0, y:0, z:0}; 
	emitter = new ParticleEmitter( new ShapePoint(pos), 200);
	bank.addEmitter(emitter);

	animLoop();
}

var lastTime = +new Date;
function animLoop()
{
	stats.begin();
	var dt = (Date.now() - lastTime)/1000.0;
	if(dt < 0.1)
		GameLoop();
	lastTime = Date.now();
	requestAnimationFrame(animLoop);
	stats.end();
}

function GameLoop()
{
	emitter.trigger();
    //----update particle systems---
	particleWorld.update();

	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	//------------------------------
	particleWorld.render();
	gl.flush ();
}