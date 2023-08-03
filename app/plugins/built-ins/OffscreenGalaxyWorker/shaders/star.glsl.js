// language=glsl
const varyingsHeader = `
  varying vec2 vUv;
  varying float vDistToCamera;
  varying vec2 vCoords;
  // Camera Y coordrinate relative to the galactic plane.
  varying float vCameraY;
`;

// language=glsl
const vertex = `
  ${varyingsHeader}

  #define CULL_DIST 0.000001
  
  #define THIN 0
  #define THICK 1
  #define GALAXY_CENTER 2

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

    vDistToCamera = distance(cameraPosition, mvPosition.xyz);
    vCameraY = cameraPosition.y;
    vCoords.xy = mvPosition.xy;

    if (vDistToCamera < CULL_DIST) {
      vDistToCamera = 0.0;
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
  ${varyingsHeader}

  #define fadeDist 0.05
  #define fadeReciprocal (1.0/fadeDist)
  #define fadeMultiplier 0.5
  
  #define pi ${Math.PI}

  float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
  }

  float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
  }
  
  float saturate(float value) {
    return clamp(value, 0.0, 1.0);
  }

  void main() {
    if (vDistToCamera == 0.0) {
      discard;
    }
    
    float scale  = 500.0;
    float invRadius = 200.0;
    float invGlowRadius = 3.0;

    // Get position relative to center.
    vec2 position = vUv;
    position.x -= 0.5;
    position.y -= 0.5;
    
    if (abs(position.x) < 0.01 && abs(position.y) < 0.01) {
      gl_FragColor = vec4(1.0);
    }
    else {
      // Airy disk calculation.
      // https://en.wikipedia.org/wiki/Airy_disk
      float diskScale = length(position) * invRadius;
      vec4 spectrum = scale * vec4(0.349, 0.493, 1.0, 1.0);

      vec4 glow = spectrum / pow(diskScale, invGlowRadius);

      gl_FragColor = vec4(glow);
    }
  }
`;

const star = {
  vertex,
  fragment,
};

export { star };
