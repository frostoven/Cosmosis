// Used to differentiate mouse buttons.
const mouseInc = 15000;

/**
 * There are some insane pieces of mouse tech out there that go a bit too far
 * and curse us with their existence, such as this 20 button abomination:
 * https://www.amazon.com/Logitech-Gaming-Backlit-Programmable-Buttons/dp/B0086UK7IQ#:~:text=For%20complete%20control%20in%20your,for%20mastering%20your%20favorite%20MMOs.
 * @param min
 * @param max
 */
// function assignMouseExtra(min, max) {
//   for (; min <= max; min++) {
//     keymap[`mouse${min}`] = min + mouseInc;
//   }
// }
// assignMouseExtra(6, 20);

// Setting that allows the user to force assigning the same key to multiple
// actions within the same mode.
// It's niche, but I aim to please, baby.
const doublePresses = {
  freeCam: [
    'tba', 'tba',
  ]
}

// Allows client to know what the player can configure. This is not optional
// and is validated during integration tests. Missing keys will be printed in
// the console.
const keySchema = {
  allModes: [
    'lockMouse'
  ],
  shipPilot: [
    'thrustInc',
    'thrustDec',
    'thrustReset',
    'left_renameme',
    'right_renameme',
  ],
  freeCam: [
    'moveForward',
    'moveBackward',
    'moveLeft',
    'moveRight',
    'moveUp',
    'moveDown',
    'turnLeft',
    'turnRight',
    'lookUp',
    'lookDown',
    'spinLeft',
    'spinRight',
    'speedUp',
    'speedDown',
  ],
  godCam: [],
}

// https://keycode.info/
const controls = {
  allModes: {
    ControlLeft: 'lockMouse',
  },
  shipPilot: {
    _description: 'Mode used when user is locked to seat.',
    KeyW: 'thrustInc',
    KeyS: 'thrustDec',
    TBA_MIDDLE_CLICK: 'thrustReset',
    KeyA: 'left_renameme',
    KeyD: 'right_renameme',
  },
  freeCam: {
    _description: 'Free camera',
    KeyW: 'moveForward',
    ArrowUp: 'moveForward',
    KeyS: 'moveBackward',
    ArrowDown: 'moveBackward',
    KeyQ: 'moveLeft',
    ArrowLeft: 'moveLeft',
    KeyE: 'moveRight',
    ArrowRight: 'moveRight',
    KeyR: 'moveUp',
    Space: 'moveUp',
    KeyF: 'moveDown',
    Numpad4: 'turnLeft',
    Numpad6: 'turnRight',
    // TODO: look up the actual terms of this shit.
    Numpad8: 'lookUp',
    Numpad2: 'lookDown',
    KeyA: 'spinLeft',
    KeyD: 'spinRight',
    NumpadAdd: 'speedUp',
    NumpadSubtract: 'speedDown',
  },
  godCam: {
    _description: 'Celestial god cam',
    noNeedForControlsWhenOmnipotent: [],
  }
};

/**
 * Used to convert literal names like 'Right' to something a bit more
 * meaningful like 'Right Arrow'.
 * TODO: keys have since been change to use `key` instead of `keyCode` - update
 *  this map to reflect that.
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
}

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
