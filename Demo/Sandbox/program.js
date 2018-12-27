const Program = {
    async create(gl, vertexShaderURL, fragmentShaderURL) {
        const vertexShader = await Program._createShader(gl, gl.VERTEX_SHADER, vertexShaderURL);
        const fragmentShader = await Program._createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderURL);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const err = gl.getProgramInfoLog(program);
            throw new Error(`(WebGL program link) ${err}`);
        }

        // program.u = Program.locateUniforms(gl, program);

        
        return program;
    },

    async _createShader(gl, type, url) {
        const shader = gl.createShader(type);

        const res = await fetch(url);
        const sourceCode = await res.text();

        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const err = gl.getShaderInfoLog(shader);
            const map = {[gl.VERTEX_SHADER]: `vertex`, [gl.FRAGMENT_SHADER]: `fragment`};
            throw new Error(`(WebGL ${map[type]} shader) ${err}`);
        }

        return shader;
    },

    locateUniforms(gl, program) {
        let uniforms = {};
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; ++i) {
            const info = gl.getActiveUniform(program, i);
            console.log('name:', info.name, 'type:', info.type, 'size:', info.size);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }


        return uniforms;
    },
};