attribute vec3 glow;
varying vec3 vGlow;

void main() {
  vGlow = glow;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 10.0 * ((1.0 / -mvPosition.z) * 50.0);
  gl_Position = projectionMatrix * mvPosition;
}
