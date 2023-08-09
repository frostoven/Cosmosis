import { import_log10 } from '../../../../shaders/shaderMath';

// language=glsl
const varyingsHeader = `
  varying vec2 vUv;
  varying float vDistToCamera;
  varying vec3 vColor;
  varying float vGlowAmount;
`;

// language=glsl
const vertex = `
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
    
    float distanceScale = vDistToCamera * 2500.0;
    
    // Calculate brightness based on the inverse square law of distance.
    float brightness = aLuminosity / (4.0 * PI * pow(distanceScale, 2.0));
    vGlowAmount = brightness;
    
    localPosition *= max(distanceScale, min(brightness * 0.01, 0.75));
    
    // -------------------------------------------------------------
    
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

  uniform float scale;
  uniform float invRadius;
  uniform float invGlowRadius;
  uniform float invFadeAggression;

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

    // Get position relative to center.
    vec2 position = vUv;
    position.x -= 0.5;
    position.y -= 0.5;
    
    vec4 transparent = vec4(0.0);

    // 0 to 1, where 0 is 0% plane diameter and 1 is 100% plane diameter.
    // float glowSize = 0.5;
    float glowSize = clamp(vGlowAmount, 0.0, 1.0);
    float halo = 1.0 - distance(vUv, vec2(0.5));
    vec4 glow = vec4(pow(halo, 4.0)) * vec4(vColor, 1.0) * -glowSize;
    glow = mix(glow, transparent, 0.5);

    // Airy disk calculation.
    // https://en.wikipedia.org/wiki/Airy_disk
    float diskScale = length(position) * invRadius;
    // Dev note: devide spectrum by glowSize for easier debugging.
    vec4 spectrum = scale * vec4(vec3(vColor), 1.0);
    vec4 color4 = spectrum / pow(diskScale, invGlowRadius);
    
    // Blending between stars tends to look really terrible, and can result in
    // combined alphas producing black stars with bright rims. This fix does
    // not prevent the problem, but it drastically reduces the glitchiness and
    // makes the effect far less obvious for far-away stars.
    if (vDistToCamera > 0.0025 && abs(color4.r) > 0.75 && abs(color4.g) > 0.75 && abs(color4.b) > 0.75) {
      color4.a = color4.a >= 0.0 ? 1.0 : -1.0;
    }
    // else if (abs(color4.r) > 0.95 && abs(color4.g) > 0.95 && abs(color4.b) > 0.95) {
    //   color4.a = color4.a >= 0.0 ? 1.0 : -1.0;
    // }
    
    // Dev note: mix is *probably* less realistic but far prettier. We should
    // consider trying to use min instead and make it pretty.
    // gl_FragColor = min(color4, glow);
    gl_FragColor = mix(color4, glow, 0.5);
    
    // Fade out stars according to their brightness.
    float fade = pow(1.0 - glowSize, invFadeAggression);
    gl_FragColor = mix(gl_FragColor, transparent, fade);
  }
`;

const star = {
  vertex,
  fragment,
};

export { star };
