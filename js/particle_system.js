
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

function ParticleWorld(webglContext)
{
	this.particleBanks = new Array();
	this.update = ParticleWorld_update;
	this.render = ParticleWorld_render;
	this.GetNowTime = ParticleWorld_GetNowTime;
	this.context = webglContext;
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

	this.pworld.context.bindBuffer(this.pworld.context.ARRAY_BUFFER, 	this.dynamicBufferGPU);
	//this.pworld.context.bufferData(this.pworld.context.ARRAY_BUFFER, this.ringBuffer, this.pworld.context.DYNAMIC_DRAW);

	if(this.activeCount > 0)
	{
		// calculate pointer to tail of alive part of particles in our ring buffer 
		var tail = this.headPoiter - (this.activeCount - 1);
		if( tail < 0 )
		{
			var arrView1 = this.ringBuffer.subarray(0, this.headPoiter * this.vertexElements); 
			this.pworld.context.bufferSubData(this.pworld.context.ARRAY_BUFFER, 0, arrView1 );
		
			tail += this.bufSize;

			var beg = tail  * this.vertexElements;
			var arrView2 = this.ringBuffer.subarray(beg, beg + (this.bufSize - tail) * this.vertexElements); 
			this.pworld.context.bufferSubData(this.pworld.context.ARRAY_BUFFER, beg * 4, arrView2 ); // multiply by 4 because offset in bytes

		}
		else
		{
			var beg = tail * this.vertexElements;
			var arrView = this.ringBuffer.subarray(beg, beg + this.activeCount * this.vertexElements); 
			this.pworld.context.bufferSubData(this.pworld.context.ARRAY_BUFFER, beg*4, arrView ); // multiply by 4 because offset in bytes
		}
	}
}

function ParticleBank_draw()
{
	this.pworld.context.useProgram(this.shader);
	for(var propt in this.customMatrixUniforms)
	{
		if (this.customMatrixUniforms.hasOwnProperty(propt)) 
		{
        	setMatrixUniform(this.pworld.context, this.shader, propt, this.customMatrixUniforms[propt]);
   		}
	}

	this.pworld.context.bindBuffer(this.pworld.context.ARRAY_BUFFER, 	this.dynamicBufferGPU);

	if(this.attributePosition != -1)	{
		this.pworld.context.enableVertexAttribArray(this.attributePosition);
		this.pworld.context.vertexAttribPointer(this.attributePosition, 3, this.pworld.context.FLOAT, false, this.vertexElements * 4, 0);
	}
	if(this.attributeDirection != -1)	{
		this.pworld.context.enableVertexAttribArray(this.attributeDirection);
		this.pworld.context.vertexAttribPointer(this.attributeDirection, 3, this.pworld.context.FLOAT, false, this.vertexElements * 4, 3*4);
	}
	if(this.attributeTime != -1)	{
		this.pworld.context.enableVertexAttribArray(this.attributeTime);
		this.pworld.context.vertexAttribPointer(this.attributeTime, 1, this.pworld.context.FLOAT, false, this.vertexElements * 4, 6*4);
	}

	this.pworld.context.bindBuffer(this.pworld.context.ARRAY_BUFFER, 	this.seedBufferGPU);

	if(this.attributeSeed != -1)	{
		this.pworld.context.enableVertexAttribArray(this.attributeSeed);
		this.pworld.context.vertexAttribPointer(this.attributeSeed, 1, this.pworld.context.FLOAT, false, 4, 0);
	}

	this.pworld.context.uniform1f(this.pworld.context.getUniformLocation(this.shader, "u_CurrentTime"), this.pworld.GetNowTime());
	this.pworld.context.uniform1f(this.pworld.context.getUniformLocation(this.shader, "u_Lifetime"), this.lifetime);

	if(this.activeCount > 0)
	{
		// calculate pointer to tail of alive part of particles in our ring buffer 
		var tail = this.headPoiter - (this.activeCount - 1);
		if( tail < 0 )
		{
			this.pworld.context.drawArrays(this.pworld.context.POINTS, 0, this.headPoiter);
			tail += this.bufSize;
			this.pworld.context.drawArrays(this.pworld.context.POINTS, tail, this.bufSize - tail);
		}
		else
		{
			this.pworld.context.drawArrays(this.pworld.context.POINTS, tail, this.activeCount);
		}
	}
	this.pworld.context.flush ();

	if(this.attributePosition != -1)	{
		this.pworld.context.disableVertexAttribArray(this.attributePosition);
	}
	if(this.attributeDirection != -1)	{
		this.pworld.context.disableVertexAttribArray(this.attributeDirection);
	}
	if(this.attributeTime != -1)	{
		this.pworld.context.disableVertexAttribArray(this.attributeTime);
	}
	if(this.attributeSeed != -1)	{
		this.pworld.context.disableVertexAttribArray(this.attributeSeed);
	}
}

function ParticleBank_initShader()
{
	this.pworld.context.useProgram(this.shader);
	enableAtribArray(this.pworld.context, this.shader, "a_Position");
	enableAtribArray(this.pworld.context, this.shader, "a_Direction");
	enableAtribArray(this.pworld.context, this.shader, "a_Time");
	enableAtribArray(this.pworld.context, this.shader, "a_Seed");
}

function ParticleBank(pworld, size, lifetime, shader)
{
	this.pworld = pworld;
	this.pworld.particleBanks.push(this);
	this.vertexElements = 7;
	this.bufSize = size;
	this.lifetime = lifetime;
	this.ringBuffer = new Float32Array(size * this.vertexElements);
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

	this.seedBuffer = new Float32Array(size);
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

	this.dynamicBufferGPU = this.pworld.context.createBuffer();
	this.pworld.context.bindBuffer(this.pworld.context.ARRAY_BUFFER, 	this.dynamicBufferGPU);
	this.pworld.context.bufferData(this.pworld.context.ARRAY_BUFFER, this.ringBuffer, this.pworld.context.DYNAMIC_DRAW);
	this.seedBufferGPU = this.pworld.context.createBuffer();
	this.pworld.context.bindBuffer(this.pworld.context.ARRAY_BUFFER, 	this.seedBufferGPU);
	this.pworld.context.bufferData(this.pworld.context.ARRAY_BUFFER, this.seedBuffer, this.pworld.context.STATIC_DRAW);

	this.shader = shader;
	this.customMatrixUniforms = new Object();
	
	this.attributePosition = this.pworld.context.getAttribLocation(this.shader, "a_Position");
	this.attributeDirection = this.pworld.context.getAttribLocation(this.shader, "a_Direction");
	this.attributeTime = this.pworld.context.getAttribLocation(this.shader, "a_Time");
	this.attributeSeed = this.pworld.context.getAttribLocation(this.shader, "a_Seed");
}
// --------------------------------------------------------------- END PARTICLE BANK ----------------------

// --------------------------------------------------------------- START PARTICLE EMITTER ----------------------

function ParticleEmitter_trigger()
{
	var i = this.releaseQuantity;
	if( this.releaseQuantity > 0.0 && this.releaseQuantity < 1.0 )
	{
		i = Math.random() < this.releaseQuantity ? 1 : 0;
	}

	while ( i > 0 ) 
	{
		var position = this.shape.nextPosition();
		var direction = this.shape.nextDirection(position);
		if(this.pbank != null && this.pworld != null)
		{
			if( !this.pbank.isFull() )
			{
				var nbr = this.pbank.nextFree();
				var index = nbr * this.pbank.vertexElements;
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