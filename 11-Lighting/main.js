const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL not supported');
}

const vertexData = [

    // Front
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, -.5, 0.5,

    // Left
    -.5, 0.5, 0.5,
    -.5, -.5, 0.5,
    -.5, 0.5, -.5,
    -.5, 0.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, -.5,

    // Back
    -.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, 0.5, -.5,
    0.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, -.5, -.5,

    // Right
    0.5, 0.5, -.5,
    0.5, -.5, -.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    0.5, -.5, -.5,

    // Top
    0.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, -.5,

    // Underside
    0.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, -.5,
];

function quad(a, b, c, d) {
    return [
        ...a, ...b, ...c, 
        ...c, ...b, ...d
    ];
}

// my convention: start -, move CW
function rect2D(x, y, w, h) {
    return quad(
        [x, y],         // lower left
        [x, y + h],     // upper left
        [x + w, y],     // lower right
        [x + w, y + h]  // upper right
    );
}

function rect2Dcentered(centerX, centerY, w, h) {
    return quad(
        [centerX - w/2, centerY + h/2],     // top left
        [centerX + w/2, centerY + h/2],     // top right
        [centerX - w/2, centerY - h/2],     // bottom left
        [centerX + w/2, centerY - h/2]);    // bottom right
}

// This will actually repeat 6 times
const uvData = [
    // F|L|B|R|T|U

    ...rect2D(0, 0, 1, 1),
    ...rect2D(0, 0, 1, 1),
    ...rect2D(0, 0, 1, 1),
    ...rect2D(0, 0, 1, 1),
    ...rect2D(0, 0, 1, 1),
    ...rect2D(0, 0, 1, 1),
];

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

const uvBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.STATIC_DRAW);

// SHADER PROGRAM
// ==============

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUV;

uniform mat4 matrix;

void main() {
    vUV = uv;
    gl_Position = matrix * vec4(position, 1);
}
`);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
precision mediump float;

varying vec2 vUV;
uniform sampler2D textureID;

void main() {
    gl_FragColor = texture2D(textureID, vUV);
}
`);
gl.compileShader(fragmentShader);
console.log(gl.getShaderInfoLog(fragmentShader));

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const uvLocation = gl.getAttribLocation(program, `uv`);
gl.enableVertexAttribArray(uvLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
// gl.blendFunc(gl.ONE, gl.ONE);

const uniformLocations = {
    matrix: gl.getUniformLocation(program, `matrix`),
    textureID: gl.getUniformLocation(program, 'textureID'),
};

// MATRICES
// ========

const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, 
    75 * Math.PI/180, // vertical field-of-view (angle, radians)
    canvas.width/canvas.height, // aspect W/H
    1e-4, // near cull distance
    1e4 // far cull distance
);

const mvMatrix = mat4.create();
const mvpMatrix = mat4.create();

// mat4.translate(modelMatrix, modelMatrix, [-1.5, 0, -2]);

mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 2]);
mat4.invert(viewMatrix, viewMatrix);

// RESOURCE LOADING
// ================

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function loadTexture(url) {
    const texture = gl.createTexture();
    const image = new Image();

    // gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const placeholderPixel = new Uint8Array([255, 255, 255, 128]);

    gl.texImage2D(
        gl.TEXTURE_2D, 
        level, 
        internalFormat, 
        1, 
        1,
        0,
        srcFormat,
        srcType,
        placeholderPixel
    );

    image.onload = e => {
        // re-bind in case other textures were created/bound before
        // image loading finished
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(
            gl.TEXTURE_2D, 
            level, 
            internalFormat, 
            srcFormat,
            srcType,
            image
        );
        
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            console.log(`Texture is not a power of two: ${url}`);
        }

        
    };

    image.src = url;

    texture.image = image;
    return texture;
}

function attachTexture(texture, location) {
    gl.activeTexture(gl.TEXTURE0 + location);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    texture.location = location;
}

const TEXTURE_FILES = [
    `default_dirt.png`,
    `default_sand.png`,
    `default_gravel.png`,
    `default_cobble.png`,
    `default_grass.png`,

    `default_obsidian.png`,
    `default_brick.png`,

    `default_snow.png`,
    `default_ice.png`,
    `default_lava.png`,
];

const textures = TEXTURE_FILES
    .map(file => `textures/${file}`)
    .map(loadTexture);

// only 96 textures may be attached at once;
gl.uniform1i(uniformLocations.textureID, 0);

let texId = 0;
setInterval(function() {
    if (texId == textures.length) {
        texId = 0;
    }

    const texture = textures[texId++];
    attachTexture(texture, 0);
    
}, 1000);


// ANIMATION LOOP
// ==============

function animate() {
    requestAnimationFrame(animate);

    mat4.rotateX(modelMatrix, modelMatrix, Math.PI/60);
    mat4.rotateY(modelMatrix, modelMatrix, 0.02);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
}

animate();
