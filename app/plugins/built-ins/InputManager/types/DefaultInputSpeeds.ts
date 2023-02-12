const DefaultInputSpeeds = {
  kbLookSpeed: 5,
  kbRotationSpeed: 0.005,
  analogButtonLookSpeed: 5,
  analogButtonRotationSpeed: 0.625,
  analogStickLookSpeed: 20,
  // TODO: find a better way of doing this. Controller stick threshold is
  //  subtracted from this value. At the time of writing, the threshold is 5,
  //  meaning that analogStickGhostWalkSpeed is effectively 1. If you set
  //  analogStickGhostWalkSpeed to 5 or lower, it will be fall below threshold
  //  and become 0.
  analogStickGhostWalkSpeed: 6,
  mouseAxisInfiniteLookSpeed: 0.375,
};

export {
  DefaultInputSpeeds,
}
