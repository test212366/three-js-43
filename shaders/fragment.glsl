#include <packing>

uniform float time;
uniform float progress;
uniform sampler2D depthInfo;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.1415926;

uniform float cameraNear;
uniform float cameraFar;


float readDepth(sampler2D depthSampler, vec2 coord) {
	float fragCoordZ = texture2D(depthSampler, coord).x;
	float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
	return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void main() {
	float depth = readDepth(depthInfo, vUv);

	gl_FragColor = vec4(vUv.r, 1., 1., 1.);
	gl_FragColor.a = 1.0;
}