precision mediump float;

attribute vec3 vertex_position;

// transformations in world-space, like translating an object
// Without the model matrix, all objects would remain at the origin (0,0,0)
uniform mat4 model_matrix;

// transformations in camera-space, like rotating the camera
// The view matrix determines what region of the world will be on-screen.
uniform mat4 view_matrix;

// transformation in screen-space, like applying perspective.
// Without the projection matrix, the world would be viewed orthographically
uniform mat4 projection_matrix;

varying vec3 fragment_position;

void main() {
    fragment_position = vertex_position;

    mat4 mvp = projection_matrix * view_matrix * model_matrix;
    gl_Position = mvp * vec4(vertex_position, 1);
}