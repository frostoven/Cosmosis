// -- Docs and notes -------------------------------------------- //

const license = `
This model is original work made for the Cosmosis project, and follows the
same license.
`;

// language=md
const description = `
Initial attempt at physically accurate light falloff using
[Airy disk](https://en.wikipedia.org/wiki/Airy_disk) calculations.

Note that the glow does not currently scale with resolution, and will appear
smaller on larger resolutions.
`;

// -- Vertex shader --------------------------------------------- //

// language=glsl
const vertexShader = `
#define PI ${Math.PI}

attribute vec3 glow;
attribute float luminosity;
varying vec3 vGlow;
varying highp float pointSize;

void main() {
  vGlow = glow;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // We can calculate how bright a star should look using the inverse square
  // law. The brightness-luminosity formula is as follows:
  //                       Luminosity
  // Apparent Brightness = ----------
  //                          4πd²
  float brightness = luminosity / (4.0 * PI * pow(-mvPosition.z, 2.0));

  gl_PointSize = log2(brightness * 1000000.0);
  pointSize = gl_PointSize;
  gl_Position = projectionMatrix * mvPosition;
}

`;

// -- Fragment shader ------------------------------------------- //

// language=glsl
const fragmentShader = `
#define MIN_SIZE (1.75)
#define MIN_SIZE_FACTOR (1.0 / 1.75)

varying vec3 vGlow;
varying highp float pointSize;

void main() {
  if (pointSize < MIN_SIZE) {
    gl_FragColor = vec4(vGlow, max(pointSize * MIN_SIZE_FACTOR, 0.05));
    return;
  }

  float starLuminosity  = 250.0;
  float invRadius = 110.0;
  float invGlowRadius = 1.9;

  // Get position relative to center.
  vec2 position = gl_PointCoord;
  position.x -= 0.5;
  position.y -= 0.5;

  // Airy disk calculation.
  // https://en.wikipedia.org/wiki/Airy_disk
  float diskScale = length(position) * invRadius;
  vec3 glow = vGlow / pow(diskScale, invGlowRadius);
  glow *= starLuminosity;

  gl_FragColor = vec4(glow, (glow.r + glow.g + glow.b) / 3.0 * 1.1 - 0.1);
}
`;

// -- Exports --------------------------------------------------- //

export default {
  license,
  description,
  vertexShader,
  fragmentShader,
}
