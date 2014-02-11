
// --------------------------------------------------------------- START SHAPE POINT ----------------------

function ShapePoint(position)
{
	this.position = position;
	this.nextPosition = function() {
		return this.position;
	}
	this.nextDirection = function(pos)
	{
		var dir = {x = Math.random(), y = Math.random()}
		var len = Math.sqrt( dir.x * dir.x + dir.y * dir.y );
		dir.x = dir.x / len;
		dir.y = dir.y / len;
		return dir;
	}
}

// --------------------------------------------------------------- END SHAPE POINT ------------------------

// --------------------------------------------------------------- START PARTICLE WORLD ----------------------

function ParticleWorld_GetNowTime()
{
	return Date.now();
}

function ParticleWorld_addBank(bank)
{
	bank.pworld = this;
	this.particleBanks.push(bank);
}

function ParticleWorld_update()
{
	for(var i = 0; i < this.particleBanks.lenght; i++)
	{
		this.particleBanks.update();
	}
}

function ParticleWorld_render()
{
	for(var i = 0; i < this.particleBanks.lenght; i++)
	{
		this.particleBanks.render();
	}
}

function ParticleWorld()
{
	this.particleBanks = new Array();
	this.update = ParticleWorld_update;
	this.render = ParticleWorld_render;
}
// ---------------------------------------------------------------- END PARTICLE WORLD -----------------------

// --------------------------------------------------------------- START PARTICLE BANK ----------------------

function ParticleBank_isFull( )
{
	return activeCount >= bufSize; // actually activeCount can't be greater than bufSize
}

function ParticleBank_nextFree( )
{
	if(activeCount == 0)
	{
		activeCount += 1;
		return headPoiter;
	}
	else if( activeCount < bufSize )
	{
		var nextPoint = headPoiter;
		if(nextPoint == bufSize - 1)
		{
			nextPoint = 0;
		}
		else
		{
			nextPoint += 1;
		}
		this.activeCount += 1;
		return headPoiter; 
	}
	return -1;
}

function ParticleBank_addEmitter( emitter )
{
	emitter.pbank = this;
	emitter.pworld = this.pworld;
	this.emitters.push( enmitter );
}

function ParticleBank_addModifier( modifier )
{
	this.modifiers.push( modifier );
}

function ParticleBank_update( )
{
	// calculate pointer to tail of alive part of particles in our ring buffer 
	var tail = this.headPoiter - this.activeCount;
	if( tail < 0 )
	{
		tail += this.bufSize;
	}
	var aliveFound = false;

	// particle expiration part here
	do
	{
		if( activeCount == 0 )
		{
			break;
		}
		// calculate amount of time passed since particle was released. 
		// If it's greater than lifetime, decrease count of alive particles
		if( ( this.pworld.GetNowTime() - this.ringBuffer[tail * this.vertexElements + 6] ) > this.lifetime )
		{
			this.activeCount -= 1;
			tail += 1;
		}
		else // if we encountered alive particle, there is no more expired ones left
		{
			aliveFound = true;
		}
		if( tail >= this.bufSize ) // loop ring buffer
		{
			tail = 0;
		}
	} while (!aliveFound)

	// update gpu buffers part here

	if(this.lastHeadPointer != this.headPoiter)
	{
		if(this.lastHeadPointer < this.headPoiter)
		{
			var difference = this.headPoiter - this.lastHeadPointer;
			// HERE RINGBUFFER IS NOT RIGHT!! Need to pass a part of array (something like: ringBuffer + ( difference * vertexElements ) )
			gl.bufferSubData(gl.ARRAY_BUFFER, this.lastHeadPointer * this.vertexElements, new Float32Array(this.ringBuffer) );
		}
		else
		{
			var difference1 = (this.bufSize - lastHeadPointer);
			var difference2 = headPoiter;
			// HERE RINGBUFFER IS NOT RIGHT!! Need to pass a part of array (something like: ringBuffer + ( difference1 * vertexElements ) )
			gl.bufferSubData(gl.ARRAY_BUFFER, this.lastHeadPointer * this.vertexElements, new Float32Array(this.ringBuffer) );

			gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.ringBuffer) );
		}
		this.lastHeadPointer = this.headPoiter;
	}
}

function ParticleBank(size, lifetime)
{
	this.vertexElements = 7;
	this.bufSize = size;
	this.lifetime = lifetime;
	this.ringBuffer = new Array(size * this.vertexElements);
	for (var i = size - 1; i >= 0; i--) 
	{
		// position
		ringBuffer[i + 0] = 0;
		ringBuffer[i + 1] = 0;
		ringBuffer[i + 2] = 0;
		// direction
		ringBuffer[i + 3] = 0;
		ringBuffer[i + 4] = 0;
		ringBuffer[i + 5] = 0;
		// time
		ringBuffer[i + 6] = 0;
	};

	this.seedBuffer = new Array(size);
	for (var i = size - 1; i >= 0; i--) 
	{
		seedBuffer[i] = Math.random();
	};
	this.update = ParticleBank_update;
	this.addEmitter = addEmitter;
	//this.addModifier = addModifier;
	this.stateManager = _stateManager;

	this.headPoiter = 0;
	this.activeCount = 0;
	this.lastHeadPointer = 0;

	this.dynamicBufferGPU = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, 	seedBufferGPU);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ringBuffer), gl.STATIC_DRAW);
	this.seedBufferGPU = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, 	seedBufferGPU);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(seedBuffer), gl.STATIC_DRAW);
}
// --------------------------------------------------------------- END PARTICLE BANK ----------------------

// --------------------------------------------------------------- START PARTICLE EMITTER ----------------------

function ParticleEmitter_trigger()
{
	var i = this.releaseQuantity - 1;
	while ( i >= 0 ) 
	{
		var position = shape.nextPosition();
		var direction = shape.nextDirection(position);
		if(this.pbank != null && this.pworld != null)
		{
			if( !this.pbank.isFull() )
			{
				var index = this.pbank.nextFree() * this.bank.vertexElements;
				// position
				this.pbank.ringBuffer[index + 0] = position.x;
				this.pbank.ringBuffer[index + 1] = position.y;
				this.pbank.ringBuffer[index + 2] = position.z;
				// direction
				this.pbank.ringBuffer[index + 3] = direction.x;
				this.pbank.ringBuffer[index + 4] = direction.y;
				this.pbank.ringBuffer[index + 5] = direction.z;
				// time
				this.pbank.ringBuffer[index + 6].direction = pworld.GetNowTime();
			}
		}

		i--;
	};
}

function ParticleEmitter(shape, releaseQuantity)
{
	this.shape = shape;
	this.bank = null;
	this.releaseQuantity = releaseQuantity;
}

// --------------------------------------------------------------- END PARTICLE EMITTER ------------------------

// --------------------------------------------------------------- BEGIN INIT STUFF ----------------------------
var w, h, gl, canvas;
var requestAnimationFrame = 
    requestAnimationFrame ||
    mozRequestAnimationFrame;
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

function initShaders(){
	shaderProgram = loadProgram (gl, "shader-vs", "shader-fs" );
	gl.useProgram(shaderProgram);

	enableAtribArray(gl, shaderProgram, "aVertexPosition");
	enableAtribArray(gl, shaderProgram, "aVertexColor");
	enableAtribArray(gl, shaderProgram, "aTexCoord");
}
// --------------------------------------------------------------- END INIT STUFF ----------------------------

// ---------------------------------------------------------------------- MAIN ----------------------
(function main(){

	var particleWorld = new ParticleWorld();

	var bank = new ParticleBank(500 /* buf size */, 1000/* lifetime */);
	particleWorld.addBank(bank);
	var emitter = new ParticleEmitter( new ShapePoint({200, 200}));
	bank.addEmitter(emitter);

	var lastUpdate = Date.now();
	var myInterval = setInterval(tick, 0);

	while(true)
	{
		//----measure delta time---
		var now = Date.now();
    	var dt = now - lastUpdate;
    	lastUpdate = now;
    	//-------------------------



    	//----update particle systems---
		particleWorld.update();
		//------------------------------
		particleWorld.render();
	}


})();