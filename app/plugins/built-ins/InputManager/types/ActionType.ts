enum ActionType {
  // Indicates that the control action should be boolean: true means the key is
  // being help down, false means the key is not being held down.
  binary = 2,
  // This triggers a single callback per key press. Can also be thought of as a
  // toggleable in some instances (e.g. press for roof lights, press again for
  // no lights).
  pulse = 4,
  // Mouse and game controllers.
  analog = 8,
}

export {
  ActionType,
}
