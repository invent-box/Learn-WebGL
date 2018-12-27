// Vertex helper
const Vertex = {
    attributes(attrs) {
        let props = {};
        let byteCount = 0;

        attrs.forEach((attr, i) => {
            const {name, id=i, type=gl.FLOAT, size=1} = attr;
            const prop = props[name] = {id, type, size};
            prop.offset = byteCount;
            byteCount += prop.size * Float32Array.BYTES_PER_ELEMENT;
        });

        props.STRIDE = byteCount;

        return props;
    },

    getAttributes(vertexDef) {
        return Object.entries(vertexDef)
            .filter(([k, v]) => (v instanceof Object) && v.id !== undefined)
            .sort((a, b) => a[1].id - b[1].id)
            .map(([k, v]) => k);
    },

    interleave(vertexDef, vertices) {
        let data1D = [];
        const order = Vertex.getAttributes(vertexDef);

        vertices.forEach(vertex => {
            order.forEach(prop => {
                const value = vertex[prop];

                if (Array.isArray(value) || value instanceof Float32Array) {
                    data1D.push(...value);
                    // value.forEach(item => data1D.push(item));
                } else {
                    data1D.push(value);
                }
            });
        });

        return new Float32Array(data1D);
    },

    attributePointer(gl, vertexDef, attribute, normalized=false) {
        gl.vertexAttribPointer(
            vertexDef[attribute].id,
            vertexDef[attribute].size,
            vertexDef[attribute].type,
            normalized,
            vertexDef.STRIDE,
            vertexDef[attribute].offset
        );
    },

    attributePointers(gl, vertexDef) {
        Vertex.getAttributes(vertexDef).forEach(attribute => {
            Vertex.attributePointer(gl, vertexDef, attribute);
        });
    },

    connectProgram(gl, vertexDef, program) {
        Vertex.getAttributes(vertexDef).forEach(attribute => {
            gl.enableVertexAttribArray(vertexDef[attribute].id);
            gl.bindAttribLocation(program, vertexDef[attribute].id, attribute);
        });
        
        gl.linkProgram(program);
        gl.useProgram(program);
    },
};