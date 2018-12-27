precision highp float;

attribute vec3 position;
attribute vec2 textureCoord;

varying vec2 vTextureCoord;

uniform mat4 mvpMatrix;

void main() {
    vTextureCoord = textureCoord;

    gl_Position = mvpMatrix * vec4(position, 1);
}