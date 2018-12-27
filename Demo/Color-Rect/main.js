let canvas
let gl

async function loadShaderProgram(vertexURL, fragmentURL) {
    
    // Fetch shader source code from given URLs

    let res;

    res = await fetch(vertexURL);
    const vertexSource = await res.text();

    res = await fetch(fragmentURL);
    const fragmentSource = await res.text();

    // Util for loading individual shaders

    function loadShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            if (type === gl.VERTEX_SHADER) {
                throw new Error(`(WebGL vertex shader) ${gl.getShaderInfoLog(shader)}`);
            } else if (type === gl.FRAGMENT_SHADER) {
                throw new Error(`(WebGL fragment shader) ${gl.getShaderInfoLog(shader)}`);
            }
        }

        return shader;
    }
    
    const vertexShader = loadShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`(WebGL shader program) ${gl.getProgramInfoLog(vertexShader)}`)
    }

    return program;
}

const FourCorners = new Float32Array([
    // Z=0
    // 1 --> 2
    // | \   |
    // |   \ |
    // 0 <-- 3
    
    -1,  -1,  0,
    -1,   1,  0,
     1,  -1,  0,
     1,   1,  0,
]);

const myVertices = FourCorners;

class App {
    constructor() {
        this.modelMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();

        this.camera = {};
        this.camera.translation = vec3.create();
        this.camera.rotation = quat.create();
    }
    
    async main() {
        canvas = document.querySelector(`canvas`);
        canvas.width = 720;//window.innerWidth;
        canvas.height = canvas.width*9/16;//window.innerHeight;
        gl = canvas.getContext(`webgl`);
    
        if (!gl) {
            throw new Error(`This browser does not support WebGL`);
        }
        
        
        const program = await loadShaderProgram(`vertex.glsl`, `fragment.glsl`);
        gl.useProgram(program);
    
        const attributes = {
            position: gl.getAttribLocation(program, `vertex_position`)
        };
    
        this.uniforms = {
            model_matrix: gl.getUniformLocation(program, `model_matrix`),
            view_matrix: gl.getUniformLocation(program, `view_matrix`),
            projection_matrix: gl.getUniformLocation(program, `projection_matrix`),
        }
    
        const buffers = {
            vertex: gl.createBuffer(),
            index: gl.createBuffer(),
        }

        // bind buffers and load data to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        gl.bufferData(gl.ARRAY_BUFFER, myVertices, gl.STATIC_DRAW);
    
        // descripe data layout of the `position` attribute
        gl.vertexAttribPointer(
            attributes.position, 
            3, /* size */
            gl.FLOAT, /* type */
            false, /* normalized? */
            12, /* stride */
            0, /* offset */
        );


        gl.enableVertexAttribArray(attributes.position);

        gl.enable(gl.DEPTH_TEST);
        
        this.render();    
    }

    update() {
        // set uniforms
        gl.uniformMatrix4fv(this.uniforms.model_matrix, false, this.modelMatrix);
        gl.uniformMatrix4fv(this.uniforms.view_matrix, false, this.viewMatrix);
        gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, this.projectionMatrix);
    }

    render() {
        this.update();

        // gl.clearColor(1, 1, 1, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, myVertices.length/3);
        requestAnimationFrame(this.render.bind(this));
    }
}

const app = new App();
app.main();