const keyMap = {
  // Arrows
  up: 38,
  left: 37,
  right: 39,
  down: 40,

  // Misc
  space: 32,

  // Alphabet
  a: 65,
  d: 68,
  f: 70,
  r: 82,
  s: 83,
  w: 87,
};

const controls = {
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

module.exports = {
  keyMap,
  controls,
};
