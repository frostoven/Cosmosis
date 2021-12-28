import { import_log10 } from './shaderMath';

// TODO: rewrite this to not use points. Points, as it turns out, look
//  different on each machine.
//  Perhaps keep a copy, name it 'starfieldBlackbody-legacy' for interest-sake.

// -- Docs and notes -------------------------------------------- //

// language=md
const license = `
This model is original work made for the Cosmosis project, and follows the
same license.
`;

// language=md
const description = `
Attempt at physically accurate light falloff using
[Airy disk](https://en.wikipedia.org/wiki/Airy_disk) calculations.

Used to draw far-away stars.

Works best with blackbody temperature as input.
`;

// -- Vertex shader --------------------------------------------- //

// language=glsl
const vertexShader = `
// TODO:
//  This shader currently only renders sizes correctly on a 777x558 resolution.
//  Other resolutions do look nice, but the sizes don't match photos. The game
//  currently isn't ready for this; implement mechanisms that cause
//  recalculation on resize proportional to display size.

#define PI ${Math.PI}

// Import math.
${import_log10}

attribute vec3 glow;
attribute float luminosity;
varying vec3 vGlow;
varying float pointSize;
varying float lum;

void main() {
  vGlow = normalize(glow);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // We can calculate how bright a star should look using the inverse square
  // law. The brightness-luminosity formula is as follows:
  //                       Luminosity
  // Apparent Brightness = ----------
  //                          4πd²
  // Note that this is NOT apparent magnitude; '0' in this case = 'no light'.
  float brightness = luminosity / pow(4.0 * PI * -mvPosition.z, 2.0);
  // TODO: ^^ Bug discovered: formula should instead be:
  //  luminosity / (4.0 * PI * pow(-mvPosition.z, 2.0));
  // We cannot however outright replace the function because it breaks existing
  // visuals. Please adjust, then correct other visuals.

  // The log10 sets a dynamic 'zero' point, while the log(brightness) adjusts
  // the actual size. It's correct up to about 5 ly, at which point stars get
  // too big, which is what the 'if' following it is for - it renders distant
  // stars larger. The honest truth is I have no idea how / why this particular
  // line works. I mashed in random formulas like an ape until it looked like
  // real photos. If someone can provide an accurate one-size-fits-all formula,
  // that would be much appreciated.
  // TODO: check if there's a way that requires less expensive math.
  pointSize = log10(brightness * 500000.0) + (log((brightness * 7500.0)) * 1.75);
  if (pointSize < 2.0) {
    pointSize = log10(brightness * 500000.0) + (brightness * 3500.0);
  }

  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * mvPosition;
}
`;

// -- Fragment shader ------------------------------------------- //

// language=glsl
const fragmentShader = `
#define PI ${Math.PI}
// The point at which we stop rendering circles, and stars rendering squares.
#define MIN_SIZE (1.75)
#define MIN_SIZE_FACTOR (1.0 / MIN_SIZE)
// If set to 1, distant stars will have pretty but false colour.
#define COLORFUL_DISTANT 0

varying vec3 vGlow;
varying float pointSize;
varying float lum;

void main() {
  if (pointSize == 0.0 || isinf(pointSize) || isnan(pointSize)) {
    discard;
  }

  if (pointSize < MIN_SIZE) {
    #if COLORFUL_DISTANT == 1
    // TODO: activate colourful distant stars if the appropriate nav module
    //  is activated.
    gl_FragColor = vec4(vGlow, max(pointSize * MIN_SIZE_FACTOR, 0.1));
    #else
    gl_FragColor = vec4(
      mix(vGlow, vec3(1.0, 1.0, 1.0), 0.95),
      max(pointSize * MIN_SIZE_FACTOR, 0.1)
    );
    #endif
    return;
  }

  // This needs to be as large as possible, but shouldn't be so large it crops
  // the image (including glow). Note however stars should never really be
  // larger than 32px on 1080p 100% dpi, and the glow is not visible at such
  // small levels, so 7500 is fine. At 64px this would need to be around 5000.
  // Note that making this smaller gives better detail, by drastically
  // increases chances of *horrible* flicker for distance stars (it hurts).
  float scale  = 7500.0;
  float invRadius = 50.0;
  float invGlowRadius = 3.0;

  // Get position relative to center.
  vec2 position = gl_PointCoord;
  position.x -= 0.5;
  position.y -= 0.5;

  // Airy disk calculation.
  // https://en.wikipedia.org/wiki/Airy_disk
  float diskScale = length(position) * invRadius;
  vec3 spectrum  = scale * vGlow;

  vec3 glow = spectrum / pow(diskScale, invGlowRadius);

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
