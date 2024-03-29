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
  #define HALF_RAD ${(Math.PI / 180) * 0.5}
  #define STAR_SIZE 1000.0
  #define FOV 90.0

  #define CULL_DIST 0.000001

  mat3 calculateLookAtMatrix(in vec3 cameraPosition, in vec3 targetPosition, in float rollAngle) {
    vec3 forwardVector = normalize(targetPosition - cameraPosition);
    vec3 rightVector = normalize(cross(forwardVector, vec3(sin(rollAngle), cos(rollAngle), 0.0)));
    vec3 upVector = normalize(cross(rightVector, forwardVector));
    return mat3(rightVector, upVector, -forwardVector);
  }

  float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
  }
  
  float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
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
    
    // Calculate brightness based on the inverse square law of distance.
    // This should return something between 0 and 1e7.
    float magnitude = aLuminosity / (4.0 * PI * pow(vDistToCamera, 2.0));
    
    // Use log10 to bring range down to single digits.
    float brightness = 1.0 / log10(max(1.0, magnitude));
    
    // Bring magnitude into a range of 0.1 to 1 (remap min: 0.107, max: 0.18).
    brightness = max(0.07, 1.0 - remap(brightness, 0.107, 0.18, 0.0, 1.0));
    
    // Send brightness to fragment shader.
    vGlowAmount = brightness;
    
    // https://threejs.org/docs/#manual/en/introduction/FAQ (preserve on resize)
    localPosition *= (2.0 * tan(HALF_RAD * FOV) * vDistToCamera) * STAR_SIZE;
    
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
  uniform float visibility;
  
  #define pi ${Math.PI}

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
    glow = mix(glow, transparent, 0.6);

    // Airy disk calculation.
    // https://en.wikipedia.org/wiki/Airy_disk
    float diskScale = length(position) * invRadius;
    // Dev note: divide spectrum by glowSize for easier debugging.
    vec4 spectrum = scale * vec4(vec3(vColor), 1.0);
    vec4 color4 = spectrum / pow(diskScale, invGlowRadius);
    
    // Desaturate the glow a tad.
    float luminance = dot(glow.rgb, vec3(0.2126, 0.7152, 0.0722));
    float amount = 0.25;
    glow = vec4(mix(vec3(luminance), glow.rgb, amount), glow.a);
    
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
    
    // This has the potential to be quite pretty, but I'm unsure how to mix
    // it in without hurting existing colors.
    float reductionMask = (abs(position.x) + abs(position.y)) * 15.0;
    float rays = ((1.0 - abs(position.x * position.y))) / reductionMask;
    color4 = vec4(vec3(-rays) * vColor, color4.a);
    
    // // Contrast. Applied to center bit of star.
    // vec3 color3 = color4.rgb;
    // float contrast = 2.0;
    // float midpoint = 0.5;
    // vec3 sg = sign(color3 - midpoint);
    // color3 = sg * pow(
    //   abs(color3 - midpoint) * 2.0,
    //   vec3(1.0 / contrast)) * 0.5 + midpoint;
    // color4 = vec4(color3.rgb, color4.a);
    
    // Combine star dot and its glow.
    gl_FragColor = min(color4, glow);
    
    // Fade out stars according to their brightness.
    float fade = clamp(vGlowAmount, 0.0, 1.0) * visibility;
    gl_FragColor = mix(transparent, gl_FragColor, fade);
  }
`;

const star = {
  vertex,
  fragment,
};

export { star };
