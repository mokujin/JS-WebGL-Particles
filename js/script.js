var w, h, gl, canvas;
var requestAnimationFrame = 
    requestAnimationFrame ||
    mozRequestAnimationFrame ||
    oRequestAnimationFrame;
var lastTime = +new Date;
window.onload = init;
var stats = new Stats();

function init () {
	// Align top-left
	stats.setMode(0);
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild( stats.domElement );

	canvas = document.getElementById("cnvs");
	initGL();
	initShaders();
    initBuffers();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	animLoop();
}
var tex;
function initGL()
{
	console.log("start initializing WebGL :|");

	gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
	if(!gl)
		console.error("fail to init webgl :(");
	else
		console.info("webgl is ok :)");
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);                             

	tex = loadImageTexture(gl, "img/someGuy.png");
	console.log("WebGL initialization finished successfully)");

}

// DANGEROUS! OVERLOADED WITH PAINFULL CODE!!111111111111!!!!11111111111 ###############################################
function initShaders(){
	shaderProgram = loadProgram (gl, "shader-vs", "shader-fs" );
	gl.useProgram(shaderProgram);

	enableAtribArray(gl, shaderProgram, "aVertexPosition");
	enableAtribArray(gl, shaderProgram, "aVertexColor");
	enableAtribArray(gl, shaderProgram, "aTexCoord");
}

var mvMatrix;
var prMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var vertexBuffer;
function initBuffers(){
	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, 	vertexBuffer);
	var vertices = [
		-1.0, -1.0,  1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
		 1.0, -1.0,  1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0,
		-1.0,  1.0,  1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		-1.0,  1.0,  1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		 1.0, -1.0,  1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0,
		 1.0,  1.0,  1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0,

		-1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 1.0,0.0, 0.0,
		 1.0, -1.0, -1.0, 0.0, 1.0, 0.0, 1.0,1.0, 0.0,
		-1.0,  1.0, -1.0, 1.0, 0.0, 1.0, 1.0,0.0, 1.0,
		-1.0,  1.0, -1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		 1.0, -1.0, -1.0, 0.0, 1.0, 0.0, 1.0,1.0, 0.0,
		 1.0,  1.0, -1.0, 0.0, 1.0, 1.0, 1.0,1.0, 1.0,

		-1.0, -1.0,  1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
		-1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 1.0,0.0, 0.0,
		-1.0,  1.0, -1.0, 1.0, 0.0, 1.0, 1.0,0.0, 1.0,
		-1.0, -1.0,  1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
		-1.0,  1.0, -1.0, 1.0, 0.0, 1.0, 1.0,0.0, 1.0,
		-1.0,  1.0,  1.0, 1.0, 0.0, 1.0, 1.0,0.0, 1.0,

	 	 1.0, -1.0,  1.0, 1.0, 1.0, 0.0, 1.0,1.0, 0.0,
		 1.0, -1.0, -1.0, 0.0, 1.0, 0.0, 1.0,1.0, 0.0,
		 1.0,  1.0, -1.0, 0.0, 1.0, 1.0, 1.0,0.0, 1.0,
		 1.0, -1.0,  1.0, 1.0, 1.0, 0.0, 1.0,1.0, 0.0,
		 1.0,  1.0, -1.0, 0.0, 1.0, 1.0, 1.0,0.0, 1.0,
		 1.0,  1.0,  1.0, 0.0, 0.0, 1.0, 1.0,1.0, 1.0,

		-1.0, -1.0,  1.0, 1.0, 0.0, 0.0, 1.0,0.0, 0.0,
		-1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 1.0,0.0, 0.0,
		 1.0, -1.0, -1.0, 0.0, 1.0, 0.0, 1.0,0.0, 1.0,
		-1.0, -1.0,  1.0, 1.0, 0.0, 0.0, 1.0,0.0, 0.0,
		 1.0, -1.0, -1.0, 0.0, 1.0, 0.0, 1.0,1.0, 0.0,
		 1.0, -1.0,  1.0, 1.0, 1.0, 0.0, 1.0,1.0, 0.0,

		-1.0,  1.0,  1.0, 1.0, 0.0, 1.0, 1.0,0.0, 1.0,
		-1.0,  1.0, -1.0, 1.0, 0.0, 1.0, 1.0,1.0, 0.0,
		 1.0,  1.0, -1.0, 0.0, 1.0, 1.0, 1.0,0.0, 1.0,
		-1.0,  1.0,  1.0, 1.0, 0.0, 1.0, 1.0,0.0, 1.0,
		 1.0,  1.0, -1.0, 0.0, 1.0, 1.0, 1.0,1.0, 0.0,
		 1.0,  1.0,  1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 9;
	vertexBuffer.numItems = 36;
}
// #####################################################################################################################
function animLoop()
{
	stats.begin();
	var dt = (Date.now() - lastTime)/1000.0;
	if(dt < 0.1)
		GameLoop(dt);
	lastTime = Date.now();
	requestAnimationFrame(animLoop);
	stats.end();
}
var r = 0.0;
var time = 0;
var p = 1;
function GameLoop(dt)
{
	if(p==1)
	{
		time += dt;
		if(time >= 1.0)
		{
			p = 0;
			time = 1.0;
		}
	}
	else
	{
		time -= dt;
		if(time <= 0){
			p = 1;
			time = 0.0;
		}
	}
	r+=	3*dt;
	//r = 0.5;
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	prMatrix = makePerspective(45, 1.0, 0.1, 100.0);
	mvMatrix = Matrix.I(4);
	mvMatrix = mvMatrix.x(Matrix.Translation($V([0.0, 0.0, -5.0])));
	mvMatrix = mvMatrix.x(to4(Matrix.RotationX(r)).x(to4(Matrix.RotationY(r)).x(to4(Matrix.RotationZ(r)))));
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	//gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.useProgram(shaderProgram);
	gl.uniform1f(gl.getUniformLocation(shaderProgram, "time"), time);
	bindPointer(gl, shaderProgram, "aVertexPosition", 3, vertexBuffer.itemSize*4, 0);
	bindPointer(gl, shaderProgram, "aVertexColor", 4, vertexBuffer.itemSize*4, 3*4);
	bindPointer(gl, shaderProgram, "aTexCoord", 2, vertexBuffer.itemSize*4, 7*4);

	//console.log(prMatrix);

	setMatrixUniform ( gl, shaderProgram, "uPMatrix", prMatrix );
	setMatrixUniform ( gl, shaderProgram, "uMVMatrix", mvMatrix );
	gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numItems);
	gl.flush ();
	
}