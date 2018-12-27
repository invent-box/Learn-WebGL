precision highp float;

varying vec2 vTextureCoord;

uniform sampler2D texture;

float quintic(float x) {
    return pow(x, 5.0);
}

void main() {

    vec4 texel = texture2D(texture, vTextureCoord);

    gl_FragColor = texel;
    // gl_FragColor = vec4(0.6,1.6,0.7, 0.9) * ;
    // gl_FragColor = vec4(0.6, 1.6, 0.7, quintic(vTextureCoord.x));
}