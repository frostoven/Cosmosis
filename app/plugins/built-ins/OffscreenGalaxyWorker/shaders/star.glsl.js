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

    // -------------------------------------------------------------

    // Get position relative to camera.
    vec4 modelViewPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vec4 projectedModelViewPosition = projectionMatrix * modelViewPosition;

    // Camera space position.
    vec4 csPosition = modelViewPosition * projectedModelViewPosition;
    vDistToCamera = distance(csPosition, projectedModelViewPosition);

    // -------------------------------------------------------------

    mvPosition = viewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    //    vec2 scale;
    //    scale.x = length(vec3(instanceMatrix[0].x, instanceMatrix[0].y, instanceMatrix[0].z));
    //    scale.y = length(vec3(instanceMatrix[1].x, instanceMatrix[1].y, instanceMatrix[1].z));

    vec2 scale;
    mat4 target = inverse(modelMatrix);
    scale.x = length(vec3(target[0].x, target[0].y, target[0].z));
    scale.y = length(vec3(target[1].x, target[1].y, target[1].z));

    vec2 center = vec2(0.5);
    vec2 alignedPosition = (position.xy - (center - vec2(0.5))) * scale;

    vec2 rotatedPosition;
    //    rotatedPosition.x = cos(rotation) * position.x - sin(rotation) * position.y;
    //    rotatedPosition.y = sin(rotation) * position.x + cos(rotation) * position.y;
    //    rotatedPosition.x = cos(0.0) * position.x;
    //    rotatedPosition.y = cos(1.0) * position.y;

    //    vec4 camDirection = modelMatrixInverse * vec4(xx, yy, zz, ww);
    //    camDirection.xyz /= camDirection.w;
    float rotation = 0.0;

    rotatedPosition.x = cos(rotation) * alignedPosition.x - sin(rotation) * alignedPosition.y;
    rotatedPosition.y = sin(rotation) * alignedPosition.x + cos(rotation) * alignedPosition.y;

    mvPosition.xy += rotatedPosition;

    //    gl_Position = projectionMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;
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

    // Airy disk calculation.
    // https://en.wikipedia.org/wiki/Airy_disk
    float diskScale = length(position) * invRadius;
    vec4 spectrum = scale * vec4(0.349, 0.493, 1.0, 1.0);

    vec4 glow = spectrum / pow(diskScale, invGlowRadius);
    
    // Blending between stars tends to look really terrible, and can result in
    // combined alphas producing black stars with bright rims. This fix does
    // not prevent the problem, but it drastically reduces the glitchiness and
    // makes the effect far less obvious for far-away stars.
    if (/**vDistToCamera > 0.000025 && */glow.r > 0.75 && glow.g > 0.75 && glow.b > 0.75) {
      glow.a = 1.0;
    }
    
    gl_FragColor = vec4(glow);
  }
`;

const star = {
  vertex,
  fragment,
};

export { star };
