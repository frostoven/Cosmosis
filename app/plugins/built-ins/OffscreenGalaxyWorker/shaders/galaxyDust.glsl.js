// const BRIGHTNESS = '1.0';

// language=glsl
const varyingsHeader = `
  varying vec2 vUv;
  varying float vDistToCamera;
  varying float vDistToCenter;
  varying vec2 vCoords;
  // Camera Y coordrinate relative to the galactic plane.
  varying float vCameraY;
`;

// language=glsl
const vertex = `
  ${varyingsHeader}

  attribute int aDustType;

  #define CULL_DIST 0.0275
  
  #define THIN 0
  #define THICK 1
  #define GALAXY_CENTER 2

  mat3 calculateLookAtMatrix(in vec3 cameraPosition, in vec3 targetPosition, in float rollAngle) {
    vec3 forwardVector = normalize(targetPosition - cameraPosition);
    vec3 rightVector = normalize(cross(forwardVector, vec3(sin(rollAngle), cos(rollAngle), 0.0)));
    vec3 upVector = normalize(cross(rightVector, forwardVector));
    return mat3(rightVector, upVector, -forwardVector);
  }

  flat out int ioDustType;
  void main() {
    vUv = uv;

    vec4 mvPosition = vec4(position, 1.0);

    ioDustType = aDustType;

    vec3 cameraRelativePosition = (mvPosition.xyz + instanceMatrix[3].xyz) - cameraPosition;
    vec3 cameraTarget = mvPosition.xyz + normalize(cameraRelativePosition);

    mat3 lookAtMatrix = calculateLookAtMatrix(mvPosition.xyz, cameraTarget, 0.0);
    mvPosition.xyz = lookAtMatrix * mvPosition.xyz;
    mvPosition = instanceMatrix * mvPosition;

    vDistToCamera = distance(cameraPosition, mvPosition.xyz);
    vCameraY = cameraPosition.y;
    vCoords.xy = mvPosition.xy;
    // Note: this assumes the galaxy will always have a world position of 0.
    vDistToCenter = distance(mvPosition.xyz, vec3(0.0, 0.0, 0.0));

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
  uniform sampler2D thinDust;

  ${varyingsHeader}

  #define fadeDist 0.05
  #define fadeReciprocal (1.0/fadeDist)
  #define fadeMultiplier 0.5

  #define THIN 0
  #define THICK 1
  #define GALAXY_CENTER 2
  
  #define HAPPY 1.0, 0.967, 0.336
  #define BROWN 0.0164, 0.0082, 0.0

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

  vec3 linearTosRGB(vec3 value ) {
    vec3 lt = vec3(lessThanEqual(value.rgb, vec3(0.0031308)));

    vec3 v1 = value * 12.92;
    vec3 v2 = pow(value.xyz, vec3(0.41666)) * 1.055 - vec3(0.055);

    return mix(v2, v1, lt);
  }

  vec3 linearTosRGB(float r, float g, float b) {
    return linearTosRGB(vec3(r, g, b));
  }

  // The MIT License
  // Copyright © 2013 Inigo Quilez
  // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  // https://www.youtube.com/c/InigoQuilez
  // https://iquilezles.org/
  //
  // https://www.shadertoy.com/view/Xsl3Dl
  vec3 hash(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(in vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
                       dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
                   mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
                       dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
               mix(mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
                       dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
                   mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
                       dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
  }

  float fbm(vec3 p, int octaves, float persistence, float lacunarity) {
    float amplitude = 0.5;
    float frequency = 1.0;
    float total = 0.0;
    float normalization = 0.0;

    for (int i = 0; i < octaves; ++i) {
      float noiseValue = noise(p * frequency);
      total += noiseValue * amplitude;
      normalization += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    total /= normalization;

    return total;
  }

  float ridgedFBM(vec3 p, int octaves, float persistence, float lacunarity) {
    float amplitude = 0.5;
    float frequency = 1.0;
    float total = 0.0;
    float normalization = 0.0;

    for (int i = 0; i < octaves; ++i) {
      float noiseValue = noise(p * frequency);
      noiseValue = abs(noiseValue);
      noiseValue = 1.0 - noiseValue;

      total += noiseValue * amplitude;
      normalization += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    total /= normalization;
    total *= total;

    return total;
  }

  float turbulenceFBM(vec3 p, int octaves, float persistence, float lacunarity) {
    float amplitude = 0.5;
    float frequency = 1.0;
    float total = 0.0;
    float normalization = 0.0;

    for (int i = 0; i < octaves; ++i) {
      float noiseValue = noise(p * frequency);
      noiseValue = abs(noiseValue);

      total += noiseValue * amplitude;
      normalization += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    total /= normalization;

    return total;
  }

  float voronoi(vec3 coords) {
    vec2 gridBasePosition = floor(coords.xy);
    vec2 gridCoordOffset = fract(coords.xy);

    float closest = 1.0;
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      for (float x = -2.0; x <= 2.0; x += 1.0) {
        vec2 neighbourCellPosition = vec2(x, y);
        vec2 cellWorldPosition = gridBasePosition + neighbourCellPosition;
        vec2 cellOffset = vec2(
          noise(vec3(cellWorldPosition, coords.z) + vec3(243.432, 324.235, 0.0)),
          noise(vec3(cellWorldPosition, coords.z))
        );

        float distToNeighbour = length(
          neighbourCellPosition + cellOffset - gridCoordOffset);
        closest = min(closest, distToNeighbour);
      }
    }

    return closest;
  }

  float stepped(float noiseSample, float resolution, float brightness, float factor) {
    float steppedSample = floor(noiseSample * brightness) / factor;
    float remainder = fract(noiseSample * resolution);
    steppedSample = (steppedSample - remainder) * 0.5 + 0.5;
    return steppedSample;
  }

  float domainWarpingFBM(vec3 coords) {
    vec3 offset = vec3(
      fbm(coords, 4, 0.5, 2.0),
      fbm(coords + vec3(43.235, 23.112, 0.0), 4, 0.5, 2.0), 0.0);
    float noiseSample = fbm(coords + offset, 1, 0.5, 2.0);

    vec3 offset2 = vec3(
      fbm(coords + 4.0 * offset + vec3(5.325, 1.421, 3.235), 4, 0.5, 2.0),
      fbm(coords + 4.0 * offset + vec3(4.32, 0.532, 6.324), 4, 0.5, 2.0), 0.0);
    noiseSample = fbm(coords + 4.0 * offset2, 1, 0.5, 2.0);

    return noiseSample;
  }

  float simpleCloud(vec3 coords) {
    float noiseSample = 1.0;
    noiseSample *= 1.0 - ridgedFBM(coords, 4, 0.5, 2.0);
    noiseSample *= turbulenceFBM(coords, 4, 0.5, 2.0);
    return noiseSample;
  }

  float thinCloud(vec3 coords) {
    float noiseSample = 1.0;
    noiseSample *= 1.0 - ridgedFBM(coords, 4, 0.5, 2.0);
    noiseSample *= turbulenceFBM(coords, 4, 0.5, 2.0);
    noiseSample *= 1.0 - voronoi(coords);
    return noiseSample;
  }

  float thickCloud(vec3 coords) {
    float noiseSample = 1.0;
    noiseSample *= 1.0 - ridgedFBM(coords, 4, 0.5, 2.0);
    noiseSample *= turbulenceFBM(coords, 4, 0.5, 2.0);
    noiseSample *= voronoi(coords);
    return noiseSample;
  }

  float chaoticCloud(vec3 coords) {
    float noiseSample = 1.0;
    noiseSample *= 1.0 - ridgedFBM(coords, 4, 0.5, 2.0);
    noiseSample *= turbulenceFBM(coords, 4, 0.5, 2.0);
    noiseSample *= 1.0 - voronoi(coords);
    noiseSample *= remap(domainWarpingFBM(coords), -1.0, 1.0, 0.0, 1.0);
    return noiseSample;
  }

  float swirlCloud(vec3 coords) {
    float noiseSample = 1.0;
    noiseSample *= 1.0 - ridgedFBM(coords, 4, 0.5, 2.0);
    noiseSample *= turbulenceFBM(coords, 4, 0.5, 2.0);
    noiseSample *= 1.0 - voronoi(coords);
    noiseSample *= remap(domainWarpingFBM(coords), -1.0, 1.0, 0.0, 1.0);
    return noiseSample;
  }

  float swirlCloudBright(vec3 coords) {
    float noiseSample = 1.0;
    noiseSample *= stepped(noiseSample, 10.0, 1.75, 0.1); // default: 10.0 all
    noiseSample *= 1.0 - ridgedFBM(coords, 4, 0.5, 2.0);
    noiseSample *= turbulenceFBM(coords, 4, 0.5, 2.0);
    noiseSample *= 1.0 - voronoi(coords);
    noiseSample *= remap(domainWarpingFBM(coords), -1.0, 1.0, 0.0, 1.0);
    return noiseSample;
  }

  float vignette() {
    float v1 = smoothstep(0.5, 0.2, abs(vUv.x - 0.5));
    float v2 = smoothstep(0.5, 0.2, abs(vUv.y - 0.5));
    float vignettAmount = v1 * v2;
    return 1.0 - vignettAmount;
  }
  
  float antiVignette() {
    float v1 = smoothstep(0.012, 0.5, abs(vUv.x - 0.5));
    float v2 = smoothstep(0.012, 0.5, abs(vUv.y - 0.5));
    float vignettAmount = v1 * v2;
    return 1.0 - vignettAmount;
  }

  flat in int ioDustType;
  void main() {
    if (vDistToCamera == 0.0) {
      discard;
    }

    // thin=0, thick=1, galacticCenter=2
    if (ioDustType == THIN) {
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.184, .569, .78, 0.01);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.184, .569, .78, 0.05);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.671, .883, 1., 0.01);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.671, .883, 1., 0.05);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.7, .9, 1., 0.01);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.7, .9, 1., 0.05);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.173, .247, .26, 0.05);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.295, .446, .53, 0.05);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.795, .875, .926, 0.0001);
//      gl_FragColor = texture2D(thinDust, vUv) * vec4(.795, .875, .926, 0.0001);
      
      
      // For the final product, we probably want one of these two depending on
      // how expore levels work out.
      gl_FragColor = texture2D(thinDust, vUv) * vec4(.512, .588, .635, 0.0001);
      // gl_FragColor = texture2D(thinDust, vUv) * vec4(.512, .588, .635, 0.001);
      //
      // This is also quite pretty if we ever wanted some additional effects:
      // gl_FragColor.r = 0.275;
      // gl_FragColor.a *= 20.0;
      
      
//      gl_FragColor.r = vCoords.y * 10.0;
//      gl_FragColor.b = vDistToCenter;
//      gl_FragColor.a *= 50.0;

//      float dist = clamp(pow(dist, 2.0), 0.0, 1.0)
//      float dist = remap(vDistToCenter, -1.0, 0.0, 1.0, 0.0);
      float dist = clamp(pow(vDistToCenter, 0.25), 0.5, 1.0);
      float alphaMax = pow(gl_FragColor.a, dist);
      
      gl_FragColor = mix(
        vec4(HAPPY, alphaMax),
        gl_FragColor,
        dist
      );
      
//      gl_FragColor.r = clamp(pow(gl_FragColor.r, 1.5), 0., 1.0);
//      gl_FragColor.g = clamp(pow(gl_FragColor.g, 1.5), 0., 1.0);
//      gl_FragColor.b = clamp(pow(gl_FragColor.b, 1.5), 0., 1.0);
//      gl_FragColor.a = 0.01;

      // // Fade in alpha; more altitude = more opacity.
      // gl_FragColor.a *= clamp((abs(vCameraY) + 0.08) * 10.0, 0.0, 1.0);
      
      // 0.01 is very close to the galactic plane. Start clipping far-away fog.
//      if (vCameraY < 0.01) {
//        gl_FragColor.r = 1.0;
        // * near galactic plane, 
//        gl_FragColor.a *= clamp(vDistToCamera, 0.0, 1.0);
//        float y = clamp(abs(vCameraY * 50.0), 0.0, 1.0);
//        gl_FragColor.a = (clamp(pow((vDistToCamera), 2.8 * y), 0.0, 1.0));
//        gl_FragColor.a = clamp(gl_FragColor.a, 0.0, 0.1);
      
      
//      float relativeDist = remap(vDistToCamera, 0.0, 1.0, 0.1, 0.0);
//      gl_FragColor.a = min(relativeDist, gl_FragColor.a);

//      float relativeDist = remap(vDistToCamera, 0.0, 1.0, 0.025, 0.0);
//      float relativeHeight = remap(abs(vCameraY), 0.0, 1.0, 0.0, 0.75);
//      gl_FragColor.a = min((relativeDist + relativeHeight) * 0.5, gl_FragColor.a);

//      float relativeDist = remap(vDistToCamera, 0.0, 1.0, 0.025, 0.0);
//      float relativeHeight = remap(abs(vCameraY), 0.0, 1.0, 0.0, 0.75);
//      float value = min((relativeDist + relativeHeight) * 0.5, gl_FragColor.a);
//      if (value < 0.01) {
//        discard;
//      }
//      else {
//        gl_FragColor = vec4(value * 0.8);
//      }
      
//      }
      return;
    }
    else if (ioDustType == GALAXY_CENTER) {
      gl_FragColor = texture2D(thinDust, vUv) * vec4(1., 0.967, .336, 0.2);
      return;
    }
//    return;

    // This pattern causes individual dust clouds to flow into their neighbors. 
    vec3 coords = vec3(vUv * 0.5, vCoords.x * vCoords.y * 0.5);
    // vec3 coords = vec3(vUv * 0.5, 12.0);

    vec3 color = vec3(1.0);
    float noise = simpleCloud(coords);
    // float noise = thinCloud(coords);
    // float noise = thickCloud(coords);
    // float noise = chaoticCloud(coords);
    // float noise = swirlCloud(coords);
    // float noise = swirlCloudBright(coords);
    color *= noise;
    color *= 3.0;

    // float vignettAmount = 1.0 - (vignette() * antiVignette());
    float vignettAmount = antiVignette();

    float average = 1.0 - ((color.x + color.y + color.z) / 3.0);
    color = vec3(color.r);

    float contrastAmount = 0.625;
    float midpoint = 0.5;
    color = (color - midpoint) * contrastAmount + midpoint;

    vec2 radialPosition = 1.0 - vUv;
    float v1 = smoothstep(1.0, 0.0, abs(vUv.x - 0.5));
    float v2 = smoothstep(1.0, 0.0, abs(vUv.y - 0.5));
    float radialDecline = pow(v1 * v2, 5.5);

    float alpha = min(pow(average, 12.0) * color.r, radialDecline * color.r);
    float antiCorner = abs(1.0 - saturate(max(pow(average, 8.0), radialDecline * 0.5)));

    // float edgeFalloff = ridgedFBM(coords, 8, 0.5, 2.0);
    // // Contast the edge.
    // float contrastAmount = 7.0;
    // float midpoint = 0.5;
    // edgeFalloff = saturate(1.0 - abs(1.0 - ((edgeFalloff - midpoint) * contrastAmount + midpoint)));
    
    vec4 color4 = vec4(color, alpha);
    
    if (antiCorner < 0.4/** || alpha < 0.1*/) {
      discard;
    }

    float nearClipOpacity = 1.0;
    if (vDistToCamera < fadeDist) {
      nearClipOpacity = (vDistToCamera / fadeDist);
      nearClipOpacity *= nearClipOpacity * nearClipOpacity * nearClipOpacity;
    }

    // vec4 mask = texture2D(alphaMask, vUv);
    // color4.w = min(color4.a, mask.r);

    color4 *= vec4(BROWN, 1.0);
//    if (color4.r > 0.25 || color4.g > 0.25 || color4.b > 0.25) {
//      color4.r = clamp(color4.r - 0.25, 0.0, 0.25);
//      color4.g = clamp(color4.g - 0.25, 0.0, 0.25);
//      color4.b = clamp(color4.b - 0.25, 0.0, 0.25);
//    }

//    color4.r = abs(1.0 - color4.r);
//    color4.g = abs(1.0 - color4.g);
//    color4.b = abs(1.0 - color4.b);
//    color4.a = abs(1.0 - color4.a);
    

    if (nearClipOpacity != 1.0) {
      // Fade as we get closer
      vec4 invisible = vec4(vec3(gl_FragColor), 0.0);
      gl_FragColor = mix(invisible, color4, nearClipOpacity * 0.5 - 0.1);
    }
    else {
      // We don't want clouds to be too visible on the other side of the galaxy.
      // We need to do two things:
      // * As player y approaches zero, clouds opposite the bludge have more transparancy.
      // * As camera distance to center increases, the previous effect decreases.
      // This will not only make the buldge more realistic, but also give the
      // appearance of more dust as we approach the center.
      // TOOD: try get these to work. They currently drastically reduce fog
      //  beauty. We may need to restrict the effect to dust specifically
      //  opposite the galactic buldge.
      // float camY = abs(vCameraY);
      // float farDustAlpha = clamp(pow(camY, 0.3), 0.0, 1.0);
      // float distanceFactor = clamp(pow(1.0 - vDistToCamera * 2.0, 0.1), 0.0, 1.0);
      // color4.a *= max(distanceFactor, farDustAlpha);
    
      gl_FragColor = color4;
      // gl_FragColor = vec4(color4.rgb, pow(color4.w, 12.0));
    }
  }
`;

const galaxyDust = {
  vertex,
  fragment,
};

export { galaxyDust };
