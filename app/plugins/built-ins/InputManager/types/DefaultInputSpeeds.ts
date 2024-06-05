/**
 * These represent various default multiplier speeds for inputs. Due to how us
 * humans expect controls to "feel," they unfortunately vary drastically not
 * only by device type, but even by individual component type inside a single
 * peripheral device.
 *
 * When the user overrides these values, they're changed on a per-binding basis
 * rather than globally. We might end up creating an exception to this rule for
 * the mouse specifically, depending on how things pan out.
 */
const DefaultInputSpeeds = {
  kbLookSpeed: 15,
  kbRotationSpeed: 0.005,
  kbAsSlider: 0.025,
  gamepadButtonLookSpeed: 5,
  gamepadButtonRotationSpeed: 0.005,
  gamepadStickAsSlider: 0.1,
  gamepadStickAsSteering: 1.34,
  analogStickLookSpeed: 20,
  analogStickGhostWalkSpeed: 1,
  mouseAxisStandardLookSpeed: 0.375,
};

export {
  DefaultInputSpeeds,
}
