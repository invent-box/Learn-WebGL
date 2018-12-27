precision mediump float;

varying vec3 fragment_position;

void main() {
    gl_FragColor = vec4(
        (fragment_position.x+1.0)*0.5,
        (fragment_position.y+1.0)*0.5, 
        1, 
        1);
}