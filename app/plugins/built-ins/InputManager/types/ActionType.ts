enum ActionType {
  // This triggers a single callback per key press. Can also be thought of as a
  // toggleable in some instances (e.g. press for roof lights, press again for
  // no lights).
  pulse = 4,
  // Sets things to the exact current mouse or game stick value.
  // If a keyboard button, the value is either 0% or 100% (0-1).
  analogLiteral = 8,
  // Add the latest mouse or game stick value.
  // If a keyboard button, the value either 0% or 100% (0-1).
  analogAdditive = 16,
  // Sets the value to the device's change in momentum.
  // If a keyboard button, the value either 0% or 100% (0-1).
  analogGravity = 64,
  // Think of this the way you would think of an analog stick. Your center is
  // a zero-point, and the value increases as you go outward. You have a
  // maximum amount you can go outward.
  analogThreshold = 128,
}

export {
  ActionType,
}
