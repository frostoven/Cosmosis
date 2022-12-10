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


  // // Add the latest mouse or game stick value in a way that looks as though a
  // // keyboard set the value, and make keyboard-down events act as though
  // // they're being re-pressed every frame.
  // // If a keyboard button, the value either 0% or 100% (0-1).
  // analogHybrid = 32,

  // Indicates that the control action should be boolean: true means the key is
  // being help down, false means the key is not being held down.
  // binary = 2,
}

export {
  ActionType,
}
