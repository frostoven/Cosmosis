#define PI 3.141592653589
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
