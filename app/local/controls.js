// Non-unique key [ctrl/alt/shift/super], on the left side of the keyboard.
const leftInc = 1000;
// Non-unique key [ctrl/alt/shift/super], on the right side of the keyboard.
const rightInc = 3000;
// Key belongs to the numpad.
const numpadInc = 7000;
// Used to differentiate mouse buttons.
const mouseInc = 15000;

// https://keycode.info/
const keymap = {
  // Arrows
  up: 38,
  left: 37,
  right: 39,
  down: 40,

  // Mouse (using: which)
  leftClick: 1 + mouseInc,
  middleClick: 2 + mouseInc,
  rightClick: 3 + mouseInc,
  mouse4: 4 + mouseInc,
  mouse5: 5 + mouseInc,
  // ^^ this continues below at assignMouseExtra.

  // Mouse scroll
  scrollUp: 99 + mouseInc,
  scrollDown: 101 + mouseInc,

  // Mouse movement
  mouseNorth: 200 + mouseInc,
  mouseEast: 202 + mouseInc,
  mouseSouth: 203 + mouseInc,
  mouseWest: 201 + mouseInc,

  // Misc
  space: 32,

  // Modifiers - these are overridden by core.js with fake values for
  // simplicity sake.
  shift: 16,
  shiftLeft: 16 + leftInc,
  shiftRight: 16 + rightInc,
  ctrl: 17,
  ctrlLeft: 17 + leftInc,
  ctrlRight: 17 + rightInc,
  alt: 18,
  altLeft: 18 + leftInc,
  altRight: 18 + rightInc,

  // Numpad
  numpadPlus: 107 + numpadInc,
  numpadMinus: 109 + numpadInc,

  // Alphabet
  a: 65,
  d: 68,
  f: 70,
  r: 82,
  s: 83,
  w: 87,
};

/**
 * There are some insane pieces of mouse tech out there that go a bit too far
 * and curse us with their existence, such as this 20 button abomination:
 * https://www.amazon.com/Logitech-Gaming-Backlit-Programmable-Buttons/dp/B0086UK7IQ#:~:text=For%20complete%20control%20in%20your,for%20mastering%20your%20favorite%20MMOs.
 * @param min
 * @param max
 */
function assignMouseExtra(min, max) {
  for (; min <= max; min++) {
    keymap[`mouse${min}`] = min + mouseInc;
  }
}
assignMouseExtra(6, 20);

const controls = {
  allModes: {
    lockMouse: [ keymap.ctrlLeft ],
  },
  shipPilot: {
    thrustInc: [ keymap.w ],
    thrustDec: [ keymap.s ],
    thrustReset: [ keymap.middleClick ],
    left_renameme: [ keymap.a ],
    right_renameme: [ keymap.d ],
  },
  freeCam: {
    _description: 'Free camera',
    forward: [ keymap.w, keymap.up ],
    back: [ keymap.s, keymap.down ],
    left: [ keymap.a, keymap.left ],
    right: [ keymap.d, keymap.right ],
    up: [ keymap.r, keymap.space ],
    down: [ keymap.f ],
    speedUp: [ keymap.numpadPlus ],
    speedDown: [ keymap.numpadMinus ],
  },
  godCam: {
    _description: 'Celestial god cam',
    noNeedForControlsWhenOmnipotent: [],
  }
}

/**
 * Used to convert literal names like 'Right' to something a bit more
 * meaningful like 'Right Arrow'.
 */
const friendlierKeyName = {
  'Up': 'Up Arrow',
  'Left': 'Left Arrow',
  'Right': 'Right Arrow',
  'Down': 'Down Arrow',
  //
  'Shift Left': 'Left Shift',
  'Shift Right': 'Right Shift',
  'Ctrl Left': 'Left Ctrl',
  'Ctrl Right': 'Right Ctrl',
  'Alt Left': 'Left Alt',
  'Alt Right': 'Right Alt',
  //
  'Mouse20': 'Mega mouse click',
};

/**
 * Converts a keymap name to a friendlier name that can be displayed to the
 * user.
 * Note: this function is slow; please don't run it every frame.
 * @param {number|string} key - The key you want a name for. This can be text,
 *  or the actual numeric key as defined in keymap.
 */
function keymapFriendlyName(key) {
  if (typeof key === 'number') {
    // Start be converting the number to the string equivalent.
    const mapKeys = Object.keys(keymap);
    for (let i = 0, len = mapKeys.length; i < len; i++) {
      const str = mapKeys[i];
      if (key === keymap[str]) {
        key = str;
        break;
      }
    }
  }

  if (typeof key === 'number') {
    // Nothing was matched above.
    return `Key ${key}`;
  }

  let result = key.replace( /([A-Z])/g, " $1" );
  result = result.charAt(0).toUpperCase() + result.slice(1);
  const friendlier = friendlierKeyName[result];
  if (friendlier) {
    return friendlier;
  }
  else {
    return result;
  }

  // let currentWord = '';
  // const words = [];
  // for (let i of key) {
  //   if (!i.match(/^[a-z]+$/)) {
  //     words.push(currentWord);
  //     currentWord = '';
  //   }
  //   currentWord += i.toLocaleLowerCase();
  // }
  //
  // if (currentWord) {
  //   words.push(currentWord);
  // }
  //
  // // Capitilise first word.
  // if (words.length > 0) {
  //   words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  // }
  //
  // return words.join(' ');
}
// window.keymapFriendlyName = keymapFriendlyName;

/**
 * Takes user input, and check if it's defined in keymap above. If not, ignores
 * keyPress. Else, calls back with the new key and terminates. This function is
 * specifically for letting the user choose key bindings in the controls menu.
 * @param ignoreKeyLocation
 * @param onPress
 */
function detectKeyPress({ ignoreKeyLocation=false }={}, onPress) {
  // TODO
}

module.exports = {
  keymap,
  controls,
};
