#define OVERBRIGHT 1

varying vec3 vGlow;

void main() {
  // 1.5: sharp; 1.75: fuzzy; 2.25: blur.
  float invRadius = 1.75;
  // 1.0: hazy; 1.25: sharp; 1.5: none; 1.75: inverse.
  float invGlowRadius = 1.25;
  // <1.0: atmospheric; 1.0: gradual; 1.5: sudden; 2.0: star-like.
  float falloff = 2.0;

  // Get distance from center.
  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));

  // Interpolate alpha given point distance from center.
  float size = 0.5;
  float alpha = smoothstep(1.0 - size * invRadius, 1.0 - size * invGlowRadius, dist);

  // Cut out opaque corner artificats. Note that 1000 is an arbitrary number,
  // larger is better.
  alpha += pow(dist, 1000.0);

  // Perform a mix between the input colour and pure white; set the bias to
  // alpha value.
  #if OVERBRIGHT
    vec3 color = mix(vec3(1.0, 1.0, 1.0), vGlow, alpha);
  #else
    vec3 color = mix(vGlow, vGlow, alpha);
  #endif

  // Return colour + alpha, provide falloff for hazy effects.
  gl_FragColor = vec4(color, abs(alpha - 1.0) * falloff);
}
