const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const gl = canvas.getContext('webgl2');

if (!gl) { throw new Error('WebGL not supported') }

class Mesh {
    constructor(gl, type, vertexDef, vertices) {
        this.type = type;
        this.gl = gl;
        this.vertexDef = vertexDef;
        this.vertices = vertices;
        
        this.texture = null;

        this.position = vec3.create();
        this.rotation = quat.create();
        this.scale = [1, 1, 1];

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        Vertex.attributePointers(gl, vertexDef);

        if (vertices !== undefined) {
            this.updateVertices(vertices);
        }
    }

    updateVertices(vertices) {
        const gl = this.gl;
        this.vertexData = Vertex.interleave(this.vertexDef, vertices);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
    }

    drawArrays() {
        const gl = this.gl;

        if (this.texture !== undefined) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawArrays(this.type, 0, this.vertices.length);
    }

    get matrix() {
        return mat4.fromRotationTranslationScale(
            mat4.create(), 
            this.rotation, this.position, this.scale);
    }

    set matrix(m) {
        mat4.getScaling(this.scale, m);
        mat4.getRotation(this.rotation, m);
        mat4.getTranslation(this.position, m);
    }
}

class PerspectiveCamera {
    constructor(aspect=16/9, fieldOfView=75) {
        this.position = vec3.create();
        this.center = vec3.add(vec3.create(), this.position, [0, 0, 1]);

        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix, fieldOfView * Math.PI/180, aspect, 1e-5, 1e5);
    }

    get matrix() {
        mat4.lookAt(this.viewMatrix, this.position, this.center, [0, 1, 0]);
        return mat4.multiply(mat4.create(), this.projectionMatrix, this.viewMatrix);
    }
}

class Renderer {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.program.u = Program.locateUniforms(gl, program);
    }

    render(scene, camera) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1i(this.program.u.texture, 0);
        
        scene.forEach(mesh => {
            const cameraProjectionViewMatrix = camera.matrix;
            const meshMatrix = mesh.matrix;
            const modelViewMatrix = mat4.multiply(mat4.create(), camera.viewMatrix, meshMatrix);
            
            if (mesh.billBoardY) {
                const m = modelViewMatrix;
                m[0]=1; 
                // m[2]=0;
                // m[4]=0;
                
                // m[6]=0;
                // m[9]=0; 
                m[11]=1;
            }
            
            const mvpMatrix = mat4.multiply(mat4.create(), camera.projectionMatrix, modelViewMatrix);
            // const mvpMatrix = mat4.multiply(mat4.create(), camera.matrix, mesh.matrix);
            gl.uniformMatrix4fv(this.program.u.mvpMatrix, false, mvpMatrix);
            
            mesh.drawArrays();
        });
    }
}

const Scene = Array;

const Geometry = {
    rect([w=1, h=1]) {
        const kx = w*.5;
        const ky = h*.5;
        return [
            {position: [-kx,   -ky, 0]},
            {position: [-kx,    ky, 0]},
            {position: [ kx,   -ky, 0]},
            {position: [ kx,    ky, 0]},
        ];
    },

    texturedRect([w=1, h=1]) {
        const kx = w*.5;
        const ky = h*.5;
        return [
            {position: [-kx,   -ky, 0], textureCoord: [0, 0]},
            {position: [-kx,    ky, 0], textureCoord: [0, 1]},
            {position: [ kx,   -ky, 0], textureCoord: [1, 0]},
            {position: [ kx,    ky, 0], textureCoord: [1, 1]},
        ];
    },

    cube() {
        return [
            [-1, 1, 1],     // Front-top-left
            [1, 1, 1],      // Front-top-right
            [-1, -1, 1],    // Front-bottom-left
            [1, -1, 1],     // Front-bottom-right
            [1, -1, -1],    // Back-bottom-right
            [1, 1, 1],      // Front-top-right
            [1, 1, -1],     // Back-top-right
            [-1, 1, 1],     // Front-top-left
            [-1, 1, -1],    // Back-top-left
            [-1, -1, 1],    // Front-bottom-left
            [-1, -1, -1],   // Back-bottom-left
            [1, -1, -1],    // Back-bottom-right
            [-1, 1, -1],    // Back-top-left
            [1, 1, -1]      // Back-top-right
        ].map(position => {position});
    }
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
  
    function isPowerOf2(value) {
        return (value & (value - 1)) == 0;
    }

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };

    image.src = url;
  
    return texture;
  }

// Descripe Vertex 
const MyVertex = {
    ...Vertex.attributes([
        {name: `position`, size: 3},
        {name: `textureCoord`, size: 2},
    ]),

    create([x = 0, y = 0, z = 0], [u=0, v=0]) {
        return {position: [x, y, z], textureCoord: [u, v]};
    }
};

function createLaser(length=1e3) {
    const laser = new Mesh(gl, gl.TRIANGLE_STRIP, MyVertex, Geometry.texturedRect([.03, length]));
    laser.texture = loadTexture(gl, 'laser-yellow.png');
    laser.position[1] = length/2;
    laser.length = length;
    laser.billBoardY = true;
    return laser;
}

function setLaserSpread(lasers, spread) {
    const divisions = lasers.length - 1;

    lasers.forEach((laser, i) => {
        const division = i - divisions/2;
        const angle = spread * division;
    
        const m = laser.matrix;
        mat4.translate(m, mat4.create(), [-division*1e-4,0,-division*1e-3]);
        mat4.rotateZ(m, m, angle);
        mat4.translate(m, m, [0,laser.length/2,0]);
        laser.matrix = m;
    });
}

// const cube = new Mesh(gl, gl.LINE_STRIP, MyVertex, Geometry.cube());

const floor = new Mesh(gl, gl.TRIANGLE_STRIP, MyVertex, Geometry.texturedRect([-10, 10]));
floor.texture = loadTexture(gl, 'tex.png');
quat.rotateX(floor.rotation, quat.create(), Math.PI/2);

const camera = new PerspectiveCamera(aspect=canvas.width/canvas.height);
camera.position = [0, 0.15, -3];
camera.center = vec3.create();

const lasers = [...Array(9)].map(createLaser);


async function main() {
    const program = await Program.create(gl, 
        `vertex-shader.glsl`, `fragment-shader.glsl`);

    Vertex.connectProgram(gl, MyVertex, program);

    const renderer = new Renderer(gl, program);

    let time = Date.now() * 0.001;
    (function animate() {
        requestAnimationFrame(animate);
        const dt = (Date.now() * 0.001 - time);
        time = Date.now() * 0.001;

        let sint = Math.sin(time);

        vec3.rotateY(camera.position, camera.position, camera.center, sint * Math.PI/1000);
        setLaserSpread(lasers, (5+5*sint)*Math.PI/180);
        renderer.render([floor, ...lasers], camera);
    })();

    window.program = program;
}

main();