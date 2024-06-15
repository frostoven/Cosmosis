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
  //  attribute vec3 aColor;
  uniform float luminosity;

  ${varyingsHeader}

  ${import_log10}

  #define PI ${Math.PI}
  #define HALF_RAD ${(Math.PI / 180) * 0.5}
  #define STAR_SIZE 1000.0
  #define FOV 90.0

  // Used by logdepthbuf_pars_vertex below.
  bool isPerspectiveMatrix(mat4 unused) {
    return true;
  }

  // Import functions needed for log-z calculations.
  #include <logdepthbuf_pars_vertex>

  float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
  }

  float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
  }

  void main() {
    vUv = uv;
    vColor = vec3(1.0, 0.87, 0.81);

    // Local space position.
    vec3 localPosition = position;

    // Get position relative to camera.
    vec4 modelViewPosition = modelViewMatrix * vec4(localPosition, 1.0);
    vDistToCamera = length(modelViewPosition.xyz);

    // Calculate brightness based on the inverse square law of distance.
    // This should return something between 0 and 1e7.
    float magnitude = luminosity / (4.0 * PI * pow(vDistToCamera, 2.0));

    // Use log10 to bring range down to single digits.
    float brightness = 1.0 / log10(max(1.0, magnitude));

    // Bring magnitude into a range of 0.1 to 1 (remap min: 0.107, max: 0.18).
    brightness = max(0.07, 1.0 - remap(brightness, 0.107, 0.18, 0.0, 1.0));

    // Send brightness to fragment shader.
    vGlowAmount = brightness;

    // Preserve on resize
    // localPosition *= (2.0 * tan(HALF_RAD * FOV) * vDistToCamera) * STAR_SIZE;

    // Calculate the correct position and scale for the plane
    vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    // Calculate the scale based on the model matrix and luminosity
    vec2 spriteScale = vec2(100.0, 100.0);
    //    spriteScale.x = length(vec3(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
    //    spriteScale.y = length(vec3(modelMatrix[1].x, modelMatrix[1].y, modelMatrix[1].z));

    float luminosityScale = sqrt(brightness); // Scale by brightness
    spriteScale *= luminosityScale;

    vec2 center = vec2(0.5);
    vec2 alignedPosition = (localPosition.xy - (center - vec2(0.5))) * spriteScale;

    vec2 rotatedPosition;
    float rotation = 0.0;

    rotatedPosition.x = cos(rotation) * alignedPosition.x - sin(rotation) * alignedPosition.y;
    rotatedPosition.y = sin(rotation) * alignedPosition.x + cos(rotation) * alignedPosition.y;

    mvPosition.xy += rotatedPosition;

    gl_Position = projectionMatrix * mvPosition;

    #include <logdepthbuf_vertex>
  }
`;

// language=glsl
const fragment = `
  ${varyingsHeader}

  uniform float scale;
  uniform float invRadius;
  uniform float invGlowRadius;
  uniform float visibility;
  uniform float luminosity;

  #define pi ${Math.PI}

  #include <logdepthbuf_pars_fragment>

  void main() {
    #include <logdepthbuf_fragment>

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

    gl_FragColor = vec4(
      abs(gl_FragColor.r),
      abs(gl_FragColor.g),
      abs(gl_FragColor.b),
      abs(gl_FragColor.a)
    );
  }
`;

const localBody = {
  vertex,
  fragment,
};

export { localBody }