import { import_log10 } from '../../../../shaders/shaderMath';

// language=glsl
const varyingsHeader = `
  varying vec2 vUv;
  varying float vDistToCamera;
  varying vec2 vCoords;
  // Camera Y coordrinate relative to the galactic plane.
  varying float vCameraY;
  varying vec3 vColor;
`;

// language=glsl
const vertex = `
  uniform float unitFactor;
  uniform float generalEvenness;
  uniform float falloffSensitivity;
  uniform float nearStarLumMultiplier;
  uniform float nearFarRatio;
  
  attribute vec3 aColor;
  attribute float aLuminosity;
  
  ${varyingsHeader}
    
  ${import_log10} 
      
  #define PI ${Math.PI}
  #define REALISM_FACTOR 0.1

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
    vColor = aColor;

    // Local space position.
    vec3 localPosition = position;

    // -------------------------------------------------------------

    // Get position relative to camera.
    vec4 modelViewPosition = modelViewMatrix * instanceMatrix * vec4(localPosition, 1.0);
    vec4 projectedModelViewPosition = projectionMatrix * modelViewPosition;

    // Camera space position.
    vec4 csPosition = modelViewPosition * projectedModelViewPosition;
    vDistToCamera = distance(csPosition, projectedModelViewPosition);

    // -------------------------------------------------------------
    
    float luminosity = aLuminosity;

    // Dev note: for the BSC5P alone, luminosities can range from
    // 0.08198708 to 205705980.57173166.
    // Some test values:
    // * Math.log(0.08) = -2.5257286443082556
    // Math.log10(0.08) = -1.0969100130080565
    // Math.log(205705980) = 19.141958425663915
    // Math.log10(205705980) = 8.313246917087296
    float l10Luminosity = abs(log10(luminosity));
    
    // Claculate brightness based on the inverse square law.
    float brightness = aLuminosity / (4.0 * PI * pow(vDistToCamera, 2.0));
    float scale;
    
    // Multiplying a number by local space position effectively scales the
    // object.
    // Dev note: best way to test this is with Andromeda (between X an Z),
    // Sirius, and Orion's belt. The belt stars should all share the same size,
    // Sirius should be slightly larger, and Andromeda should be visible.

    float lumLimit = aLuminosity * 10.15;
    float distLimit = vDistToCamera * 50000.0;
    scale = REALISM_FACTOR 
      * log10(clamp(lumLimit, generalEvenness, falloffSensitivity))
      * clamp(distLimit, nearStarLumMultiplier, nearFarRatio);
    
    if (vDistToCamera > 5100.0 * unitFactor) {
      vDistToCamera = 0.0;
      gl_Position = vec4(0.0);
      return;
    }
    
    localPosition *= scale;
    
    vec4 mvPosition = viewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    vec2 spriteScale;
    mat4 target = inverse(modelMatrix);
    spriteScale.x = length(vec3(target[0].x, target[0].y, target[0].z));
    spriteScale.y = length(vec3(target[1].x, target[1].y, target[1].z));

    vec2 center = vec2(0.5);
    vec2 alignedPosition = (localPosition.xy - (center - vec2(0.5))) * spriteScale;

    vec2 rotatedPosition;
    float rotation = 0.0;

    rotatedPosition.x = cos(rotation) * alignedPosition.x - sin(rotation) * alignedPosition.y;
    rotatedPosition.y = sin(rotation) * alignedPosition.x + cos(rotation) * alignedPosition.y;

    mvPosition.xy += rotatedPosition;
    
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
    vec4 spectrum = scale * vec4(vec3(vColor), 1.0);

    vec4 glow = spectrum / pow(diskScale, invGlowRadius);
    
    // Blending between stars tends to look really terrible, and can result in
    // combined alphas producing black stars with bright rims. This fix does
    // not prevent the problem, but it drastically reduces the glitchiness and
    // makes the effect far less obvious for far-away stars.
    if (vDistToCamera > 0.000025 && glow.r > 0.75 && glow.g > 0.75 && glow.b > 0.75) {
      glow.a = 1.0;
    }
    else if (glow.r > 0.95 && glow.g > 0.95 && glow.b > 0.95) {
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
