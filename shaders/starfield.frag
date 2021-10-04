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
