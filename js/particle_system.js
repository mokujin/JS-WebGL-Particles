
// --------------------------------------------------------------- START SHAPE POINT ----------------------

function ShapePoint(position)
{
	this.position = position;
	this.nextPosition = function() {
		return this.position;
	}
	this.nextDirection = function(pos)
	{
		var dir = {x:Math.random() * 2.0 - 1.0, y:Math.random() * 2.0 - 1.0, z:0};
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
	return new Date().getTime() - this.StartTime;
}

function ParticleWorld_addBank(bank)
{
	bank.pworld = this;
	this.particleBanks.push(bank);
}

function ParticleWorld_update()
{
	for(var i = 0; i < this.particleBanks.length; i++)
	{
		this.particleBanks[i].update();
	}
}

function ParticleWorld_render()
{
	for(var i = 0; i < this.particleBanks.length; i++)
	{
		this.particleBanks[i].render();
	}
}

function ParticleWorld()
{
	this.particleBanks = new Array();
	this.update = ParticleWorld_update;
	this.render = ParticleWorld_render;
	this.addBank = ParticleWorld_addBank;
	this.GetNowTime = ParticleWorld_GetNowTime;

	this.StartTime = new Date().getTime();
}
// ---------------------------------------------------------------- END PARTICLE WORLD -----------------------

// --------------------------------------------------------------- START PARTICLE BANK ----------------------

function ParticleBank_isFull( )
{
	return this.activeCount >= this.bufSize; // actually activeCount can't be greater than bufSize
}

function ParticleBank_nextFree( )
{
	if(this.activeCount == 0)
	{
		this.activeCount += 1;
		return this.headPoiter;
	}
	else if( this.activeCount < this.bufSize )
	{
		var nextPoint = this.headPoiter;
		if(nextPoint == this.bufSize - 1)
		{
			nextPoint = 0;
		}
		else
		{
			nextPoint += 1;
		}
		this.activeCount += 1;
		this.headPoiter = nextPoint;
		return this.headPoiter; 
	}
	return -1;
}

function ParticleBank_addEmitter( emitter )
{
	emitter.pbank = this;

	emitter.pworld = this.pworld;
	this.emitters.push( emitter );
}

function ParticleBank_addModifier( modifier )
{
	this.modifiers.push( modifier );
}

function ParticleBank_update( )
{
	// calculate pointer to tail of alive part of particles in our ring buffer 
	var tail = this.headPoiter - (this.activeCount - 1);
	if( tail < 0 )
	{
		tail += this.bufSize;
	}
	var aliveFound = false;

	// particle expiration part here
	do
	{
		if( this.activeCount == 0 )
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

	gl.bindBuffer(gl.ARRAY_BUFFER, 	this.dynamicBufferGPU);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.ringBuffer), gl.DYNAMIC_DRAW);
/*
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
	}*/
}

function ParticleBank_draw()
{
	gl.useProgram(this.shader);
	gl.bindBuffer(gl.ARRAY_BUFFER, 	this.dynamicBufferGPU);

	//gl.uniform1f(gl.getUniformLocation(this.shader, "time"), time);
	bindPointer(gl, this.shader, "a_Position", 	3, this.vertexElements * 4, 0  );
	bindPointer(gl, this.shader, "a_Direction", 3, this.vertexElements * 4, 3*4);
	bindPointer(gl, this.shader, "a_Time", 		1, this.vertexElements * 4, 6*4);

	gl.bindBuffer(gl.ARRAY_BUFFER, 	this.seedBufferGPU);

	bindPointer(gl, this.shader, "a_Seed", 		1, 4, 0);

	gl.uniform1f(gl.getUniformLocation(this.shader, "u_CurrentTime"), this.pworld.GetNowTime());
	gl.uniform1f(gl.getUniformLocation(this.shader, "u_Lifetime"), this.lifetime);

	if(this.activeCount > 0)
	{
		// calculate pointer to tail of alive part of particles in our ring buffer 
		var tail = this.headPoiter - this.activeCount;
		if( tail < 0 )
		{
			gl.drawArrays(gl.POINTS, 0, this.headPoiter);
			tail += this.bufSize;
			gl.drawArrays(gl.POINTS, tail, this.bufSize - tail);
		}
		else
		{
			gl.drawArrays(gl.POINTS, this.headPoiter - this.activeCount, this.activeCount);
		}
	}
	gl.flush ();
}

function ParticleBank_initShader()
{
	gl.useProgram(this.shader);
	enableAtribArray(gl, this.shader, "a_Position");
	enableAtribArray(gl, this.shader, "a_Direction");
	enableAtribArray(gl, this.shader, "a_Time");
	enableAtribArray(gl, this.shader, "a_Seed");
}

function ParticleBank(size, lifetime, shader)
{
	this.vertexElements = 7;
	this.bufSize = size;
	this.lifetime = lifetime;
	this.ringBuffer = new Array(size * this.vertexElements);
	for (var i = size - 1; i >= 0; i--) 
	{
		// position
		this.ringBuffer[i + 0] = 0;
		this.ringBuffer[i + 1] = 0;
		this.ringBuffer[i + 2] = 0;
		// direction
		this.ringBuffer[i + 3] = 0;
		this.ringBuffer[i + 4] = 0;
		this.ringBuffer[i + 5] = 0;
		// time
		this.ringBuffer[i + 6] = 0;
	};

	this.seedBuffer = new Array(size);
	for (var i = size - 1; i >= 0; i--) 
	{
		this.seedBuffer[i] = Math.random();
	};

	this.emitters = [];

	this.initShader = ParticleBank_initShader;
	this.update = ParticleBank_update;
	this.render = ParticleBank_draw;
	this.addEmitter = ParticleBank_addEmitter;
	this.isFull = ParticleBank_isFull;
	this.nextFree = ParticleBank_nextFree;
	//this.addModifier = addModifier;

	this.headPoiter = 0;
	this.activeCount = 0;
	this.lastHeadPointer = 0;

	this.dynamicBufferGPU = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, 	this.dynamicBufferGPU);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.ringBuffer), gl.DYNAMIC_DRAW);
	this.seedBufferGPU = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, 	this.seedBufferGPU);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.seedBuffer), gl.STATIC_DRAW);

	this.shader = shader;
	this.initShader();
}
// --------------------------------------------------------------- END PARTICLE BANK ----------------------

// --------------------------------------------------------------- START PARTICLE EMITTER ----------------------

function ParticleEmitter_trigger()
{
	var i = this.releaseQuantity - 1;
	while ( i >= 0 ) 
	{
		var position = this.shape.nextPosition();
		var direction = this.shape.nextDirection(position);
		if(this.pbank != null && this.pworld != null)
		{
			if( !this.pbank.isFull() )
			{
				var index = this.pbank.nextFree() * this.pbank.vertexElements;
				// position
				this.pbank.ringBuffer[index + 0] = position.x;
				this.pbank.ringBuffer[index + 1] = position.y;
				this.pbank.ringBuffer[index + 2] = position.z;
				// direction
				this.pbank.ringBuffer[index + 3] = direction.x;
				this.pbank.ringBuffer[index + 4] = direction.y;
				this.pbank.ringBuffer[index + 5] = direction.z;
				// time
				this.pbank.ringBuffer[index + 6] = this.pworld.GetNowTime();
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
	this.trigger = ParticleEmitter_trigger;
}

// --------------------------------------------------------------- END PARTICLE EMITTER ------------------------

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
	
	particleWorld = new ParticleWorld();

	var bank = new ParticleBank(5000 /* buf size */, 10000/* lifetime */, loadProgram (gl, "shader-vs", "shader-fs" ));
	particleWorld.addBank(bank);
	var pos = {x:0, y:0, z:0}; 
	emitter = new ParticleEmitter( new ShapePoint(pos), 2);
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