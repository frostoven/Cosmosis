// TODO:
//  This shader currently only renders sizes correctly on a 777x558 resolution.
//  Other resolutions do look nice, but the sizes don't match photos. The game
//  currently isn't ready for this; implement mechanisms that cause
//  recalculation on resize proportional to display size.

#define PI 3.141592653589
// Reciprocal of log(10). Core component needed to calculate log10(x).
#define RLOG10 (1.0 / log(10.0))

attribute vec3 glow;
attribute float luminosity;
varying vec3 vGlow;
varying float pointSize;
varying float lum;

float log10(float number) {
  return RLOG10 * log(number);
}

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
