// language=glsl
const vertex = `
  uniform sampler2D texture1;
  
  varying vec2 vUv;
  varying float distToCamera;

   #define cullDist 0.0275

  mat3 calculateLookAtMatrix(in vec3 cameraPosition, in vec3 targetPosition, in float rollAngle) {
    vec3 forwardVector = normalize(targetPosition - cameraPosition);
    vec3 rightVector = normalize(cross(forwardVector, vec3(sin(rollAngle), cos(rollAngle), 0.0)));
    vec3 upVector = normalize(cross(rightVector, forwardVector));
    return mat3(rightVector, upVector, -forwardVector);
  }

  void main() {
    vUv = uv;

    vec4 mvPosition = vec4(position, 1.0);

    vec3 cameraRelativePosition = (mvPosition.xyz + instanceMatrix[3].xyz) - cameraPosition;
    vec3 cameraTarget = mvPosition.xyz + normalize(cameraRelativePosition);

    mat3 lookAtMatrix = calculateLookAtMatrix(mvPosition.xyz, cameraTarget, 0.0);
    mvPosition.xyz = lookAtMatrix * mvPosition.xyz;
    mvPosition = instanceMatrix * mvPosition;

    distToCamera = distance(cameraPosition, mvPosition.xyz);

    if (distToCamera < cullDist) {
      distToCamera = 0.0;
      gl_Position = vec4(0.0);
    }
    else {

      vec4 modelViewPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  }
`;

// language=glsl
const fragment = `
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform float alphaTest;
  varying vec2 vUv;
  varying float distToCamera;

  #define fadeDist 0.05
  #define fadeReciprocal (1.0/fadeDist)
  #define fadeMultiplier 0.5

  void main() {
    if (distToCamera == 0.0) {
      discard;
    }
    
    vec4 color1 = texture2D(texture1, vUv);
    vec4 color2 = texture2D(texture2, vUv);

    if (color1.a < alphaTest && color2.a < alphaTest) {
      discard;
    }

    float opacity = 1.0;
    if (distToCamera < fadeDist) {
      opacity = (distToCamera / fadeDist);
      opacity *= opacity * opacity * opacity;
    }

    gl_FragColor = mix(color1, color2, 0.5);
    gl_FragColor = mix(gl_FragColor, vec4(gl_FragColor.rgb, 0.0), 0.5);

    // Fade as we get closer
    vec4 invisible = vec4(vec3(gl_FragColor), 0.0);
    gl_FragColor = mix(invisible, gl_FragColor, opacity - 0.1);
  }
`;

const galaxyDust = {
  vertex,
  fragment,
};

export { galaxyDust };
