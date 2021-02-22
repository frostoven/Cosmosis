// Setting that allows the user to force assigning the same key to multiple
// actions within the same mode.
// It's niche, but I aim to please, baby.
  // TODO: implement me.
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
    'enterFullScreen',
    'toggleMousePointer', // a.k.a. PointerLockControls.
    '_devChangeMode',
  ],
  shipPilot: [
    'thrustInc',
    'thrustDec',
    'thrustReset',
    'thrustUp10',
    'toggleMouseControl',
    // 'toggleMousePointer', // a.k.a. PointerLockControls.
    'left_renameme',
    'right_renameme',
    'hyperdrive',
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
    'use',
    'doubleSpeed',
  ],
  godCam: [],
}

// Use `event.code`. Easy reference: https://keycode.info/
const controls = {
  allModes: {
    ControlLeft: 'toggleMousePointer', // a.k.a. PointerLockControls.
    F11: 'enterFullScreen',
    F8: '_devChangeMode',
  },
  shipPilot: {
    _description: 'Mode used when user is locked to seat.',
    KeyW: 'thrustInc',
    KeyS: 'thrustDec',
    spMouseMiddle: 'toggleMouseControl',
    spScrollUp : 'thrustUp10',
    spScrollDown: 'thrustReset',
    KeyA: 'left_renameme',
    KeyD: 'right_renameme',
    KeyJ: 'hyperdrive',
    KeyG: 'debugGravity',
    // ControlLeft: 'toggleMousePointer', // a.k.a. PointerLockControls.
  },
  freeCam: {
    _description: 'Free camera',
    KeyW: 'moveForward',
    ArrowUp: 'moveForward',
    KeyS: 'moveBackward',
    ArrowDown: 'moveBackward',
    Numpad7: 'spinLeft',
    ArrowLeft: 'moveLeft',
    Numpad9: 'spinRight',
    ArrowRight: 'moveRight',
    KeyR: 'moveUp',
    Space: 'moveUp',
    KeyF: 'moveDown',
    Numpad4: 'turnLeft',
    Numpad6: 'turnRight',
    // TODO: look up the actual terms of this shit - x,y,z -> pitch,yaw,roll ?
    Numpad8: 'lookUp',
    Numpad2: 'lookDown',
    KeyA: 'moveLeft',
    KeyD: 'moveRight',
    NumpadAdd: 'speedUp',
    NumpadSubtract: 'speedDown',
    KeyE: 'interact',
    ShiftLeft: 'doubleSpeed',
    ShiftRight: 'doubleSpeed',
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

// --- tests ------------------------------------------------------------------

const tests = {
  validateSchema: () => {
    let errors = 0;
    for (const [mode, allMappings] of Object.entries(controls)) {
      const modeSchema = keySchema[mode];
      if (!modeSchema) {
        console.error(
          `[272] Mode "${mode}" has key mappings but isn't defined in the ` +
          'schema. This means that the mapped keys won\'t show up in the ' +
          `controls menu! Please add a "${mode}" entry to \`controls.js\` ` +
          '-> `keySchema`.'
        );
        errors++;
        continue;
      }
      for (const [button, action] of Object.entries(allMappings)) {
        if (button === '_description' || !action.length) {
          // Special reserved key or empty value.
          continue;
        }
        if (!Array.isArray(modeSchema) || !modeSchema.includes(action)) {
          console.error(
            `[287] Mode "${mode}" does not have action "${action}" defined` +
            'in the schema. This means that it won\'t show up in controls ' +
            `menu! Please add "${action}" to \`controls.js\` -> \`keySchema\`. ` +
            `Debug info: key is currently mapped as "${button}".`
          );
          errors++;
        }
      }
    }
    if (!errors) {
      console.log('Control schema valid.');
    }
    return errors === 0;
  },
};

module.exports = {
  tests,
  controls,
  keySchema,
};
