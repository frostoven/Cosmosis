#define PI 3.141592653589

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
  float brightness = luminosity / pow(4.0 * PI * -mvPosition.z, 2.0);

  gl_PointSize = log2(brightness * 1000000.0);
  pointSize = gl_PointSize;
  gl_Position = projectionMatrix * mvPosition;
}
