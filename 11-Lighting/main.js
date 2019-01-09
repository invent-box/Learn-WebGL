/*
 * Title: Learn WebGL #11 - Lighting
 * Author: Darius @ InventBox <inventboxtutorial@gmail.com>
 */

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL not supported');
}

// F|L|B|R|T|U
const vertexData = [

    // Front
    0.5, 0.5, 0.5, // top right 
    0.5, -.5, 0.5, // bottom right
    -.5, 0.5, 0.5, // top left
    -.5, 0.5, 0.5, // top left
    0.5, -.5, 0.5, // bottom right
    -.5, -.5, 0.5, // bottom left

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

    0.5, 0.5, -.5,
    0.5, -.5, -.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, -.5, -0.5,
    0.5, -.5, 0.5,

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

// Construct an Array by repeating `pattern` n times
function repeat(n, pattern) {
    return [...Array(n)].reduce(sum => sum.concat(pattern), []);
}

const uvData = repeat(6, [
    1, 1, // top right
    1, 0, // bottom right
    0, 1, // top left

    0, 1, // top left
    1, 0, // bottom right
    0, 0  // bottom left
]);

// F|L|B|R|T|U
const normalData = [
    ...repeat(6, [0, 0, 1]),    // Z+
    ...repeat(6, [-1, 0, 0]),   // X-
    ...repeat(6, [0, 0, -1]),   // Z-
    ...repeat(6, [1, 0, 0]),    // X+
    ...repeat(6, [0, 1, 0]),    // Y+
    ...repeat(6, [0, -1, 0]),   // Y-
]

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

const uvBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.STATIC_DRAW);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);

// RESOURCE LOADING
// ================

function loadTexture(url) {
    const texture = gl.createTexture();
    const image = new Image();

    image.onload = e => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.generateMipmap(gl.TEXTURE_2D);
    };

    image.src = url;
    return texture;
}

const brick = loadTexture(`textures/invent-box-logo-512px.jpg`);

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, brick);

// SHADER PROGRAM
// ==============
let uniformLocations;
(function shaderProgram() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
    precision mediump float;

    const vec3 lightDirection = normalize(vec3(0, 1.0, 1.0));
    const float ambient = 0.1;

    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 normal;

    varying vec2 vUV;
    varying float vBrightness;

    uniform mat4 matrix;
    uniform mat4 normalMatrix;

    void main() {        
        vec3 worldNormal = (normalMatrix * vec4(normal, 1)).xyz;
        float diffuse = max(0.0, dot(worldNormal, lightDirection));

        vUV = uv;
        vBrightness = ambient + diffuse;

        gl_Position = matrix * vec4(position, 1);
    }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
    precision mediump float;

    varying vec2 vUV;
    varying float vBrightness;

    uniform sampler2D textureID;

    void main() {
        vec4 texel = texture2D(textureID, vUV);
        texel.xyz *= vBrightness;
        gl_FragColor = texel;
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

    const normalLocation = gl.getAttribLocation(program, `normal`);
    gl.enableVertexAttribArray(normalLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    uniformLocations = {
        matrix: gl.getUniformLocation(program, `matrix`),
        normalMatrix: gl.getUniformLocation(program, `normalMatrix`),
        textureID: gl.getUniformLocation(program, 'textureID'),
    };

    gl.uniform1i(uniformLocations.textureID, 0);
})();


// MATRICES
// ========
const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, 
    75 * Math.PI / 180, // vertical field-of-view (angle, radians)
    canvas.width / canvas.height, // aspect W/H
    1e-4, // near cull distance
    1e4 // far cull distance
);

const mvMatrix = mat4.create();
const mvpMatrix = mat4.create();

mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 2]);
mat4.invert(viewMatrix, viewMatrix);

const normalMatrix = mat4.create();

// ANIMATION LOOP
// ==============

function animate() {
    requestAnimationFrame(animate);

    mat4.rotateX(modelMatrix, modelMatrix, Math.PI/100);
    mat4.rotateY(modelMatrix, modelMatrix, Math.PI/200);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);

    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    
    gl.uniformMatrix4fv(uniformLocations.normalMatrix, false, normalMatrix);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
}

animate();
