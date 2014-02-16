Matrix.Translation = function (v)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}
function to4(mat)
{
    var res = Matrix.I(4);
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j<3; j++) {
            res.elements[i][j] = mat.elements[i][j];
        };
    };
    return res;
}
Matrix.prototype.flatten = function ()
{
    var result = [];
    if (this.elements.length == 0)
        return [];


    for (var j = 0; j < this.elements[0].length; j++)
        for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
    return result;
}
function getShader ( gl, id )
{
	var shaderScript = document.getElementById ( id );

	if (!shaderScript)
		return null;

	var str = "";
	var k = shaderScript.firstChild;

	while ( k ) 
	{
		if ( k.nodeType == 3 )
			str += k.textContent;

		k = k.nextSibling;
	}

	var shader;

	if ( shaderScript.type == "x-shader/x-fragment" )
		shader = gl.createShader ( gl.FRAGMENT_SHADER );
	else if ( shaderScript.type == "x-shader/x-vertex" )
		shader = gl.createShader(gl.VERTEX_SHADER);
	else
		return null;

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
	{
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function loadProgram ( gl, vertId, fragId ) 
{
	var fragmentShader = getShader ( gl, vertId );
	var vertexShader   = getShader ( gl, fragId );
	var shaderProgram  = gl.createProgram ();
	
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert("Could not initialise shaders");
		
		return null;
	}
	
	return shaderProgram;
}

function enableAtribArray(gl, program, name){
	atrb = gl.getAttribLocation(program, name);
	gl.enableVertexAttribArray(atrb);
}

function setMatrixUniform ( gl, program, name, mat )
{
    var loc  = gl.getUniformLocation ( program, name );
    gl.uniformMatrix4fv ( loc,  false, new Float32Array(mat.flatten())); 
}

function bindPointer(gl, program, name, elements, stride, offset)
{
	var pos = gl.getAttribLocation(program, name);
    if( pos != -1)
	   gl.vertexAttribPointer(pos, elements, gl.FLOAT, false, stride, offset);
}

function createGLTexture(gl, image, texture)
{
    //gl.enable(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.BGRA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    //gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;   
}
function loadImageTexture(gl, url)
{
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function() { texture = createGLTexture(gl, texture.image, texture); }
    texture.image.src = url;
	
    return texture;
}

//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
function makeFrustum(left, right,
                     bottom, top,
                     znear, zfar)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
}
function checkError(gl)
{
	gl.getError()
}