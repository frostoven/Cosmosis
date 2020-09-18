const leftInc = 1000;
const rightInc = 2000;
const numpadInc = 3000;

const keyMap = {
  // Arrows
  up: 38,
  left: 37,
  right: 39,
  down: 40,

  // Misc
  space: 32,

  // Modifiers - these are overridden by core with fake values for simplicity
  // sake.
  shift: 16,
  shift_left: 16 + leftInc,
  shift_right: 16 + rightInc,
  ctrl: 17,
  ctrl_left: 17 + leftInc,
  ctrl_right: 17 + rightInc,
  alt: 18,
  alt_left: 18 + leftInc,
  alt_right: 18 + rightInc,

  // Alphabet
  a: 65,
  d: 68,
  f: 70,
  r: 82,
  s: 83,
  w: 87,
};

const controls = {
  allModes: {
    lockMouse: [ keyMap.ctrl_left ],
  },
  freeCam: {
    _description: 'Free camera',
    forward: [ keyMap.w, keyMap.up ],
    back: [ keyMap.s, keyMap.down ],
    left: [ keyMap.a, keyMap.left ],
    right: [ keyMap.d, keyMap.right ],
    up: [ keyMap.r, keyMap.space ],
    down: [ keyMap.f ],
  }
}

/**
 * Takes user input, and check if it's defined in keyMap above. If not, ignores
 * keyPress. Else, calls back with the new key and terminates. This function is
 * specifically for letting the user choose key bindings in the controls menu.
 * @param ignoreKeyLocation
 * @param onPress
 */
function detectKeyPress({ ignoreKeyLocation=false }={}, onPress) {
  // TODO
}

module.exports = {
  keyMap,
  controls,
};
