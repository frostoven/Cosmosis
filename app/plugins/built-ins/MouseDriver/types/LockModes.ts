enum LockModes {
  // Mouse does not cause the camera to move in this mode.
  frozen = 2,
  // Can look freely in all directions without restriction.
  freeLook = 4,
  // Can look 110 degrees from origin before mouse stops moving.
  headLook = 8,
}

export {
  LockModes,
}
