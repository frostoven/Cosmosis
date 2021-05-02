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
    'debugFullWarpSpeed',
    'thrustUp10',
    'toggleMouseSteering',
    // 'toggleMousePointer', // a.k.a. PointerLockControls.
    'rollLeft',
    'rollRight',
    'engageHyperdrive',
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
    'interact',
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
    spMouseMiddle: 'toggleMouseSteering',
    Numpad5: 'toggleMouseSteering',
    spScrollUp : 'thrustUp10',
    spScrollDown: 'thrustReset',
    ScrollLock: 'debugFullWarpSpeed',
    KeyA: 'rollLeft',
    KeyD: 'rollRight',
    KeyJ: 'engageHyperdrive',
    KeyG: '_debugGravity',
    // ControlLeft: 'toggleMousePointer', // a.k.a. PointerLockControls.
  },
  freeCam: {
    _description: 'Free flying camera (press F8 to activate)',
    KeyW: 'moveForward',
    ArrowUp: 'moveForward',
    KeyS: 'moveBackward',
    ArrowDown: 'moveBackward',
    Numpad7: 'rollLeft',
    ArrowLeft: 'moveLeft',
    Numpad9: 'rollRight',
    ArrowRight: 'moveRight',
    KeyR: 'moveUp',
    Space: 'moveUp',
    KeyF: 'moveDown',
    KeyA: 'moveLeft',
    KeyD: 'moveRight',
    NumpadAdd: 'speedUp',
    NumpadSubtract: 'speedDown',
    ShiftLeft: 'doubleSpeed',
    ShiftRight: 'doubleSpeed',
    KeyE: 'interact',
    // TODO: These stopped working for some reason. Either investigate why that
    //  is, or remove the functionality.
    // Numpad4: 'turnLeft',
    // Numpad6: 'turnRight',
    // Numpad8: 'lookUp',
    // Numpad2: 'lookDown',
  },
  godCam: {
    _description: 'Celestial god cam',
    // noNeedForControlsWhenOmnipotent()
  }
};

/**
 * For use in the keybinding menu. Meant to explain to the player what
 * everything does.
 */
const keyManual = {
  shipPilot: {
    toggleMouseSteering: 'Switches between using the mouse for steering and looking around.',
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
  validatePlayerControlsSchema: () => {
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
        // Example:
        // button === 'KeyE', action === 'interact'

        if ((button && button[0] === '_') || (action && (action[0] === '_'))) {
          // Underscored buttons are ignored by the application. Underscored
          // actions are functional but not displayed in the controls menu.
          continue;
        }

        if (
          typeof action !== 'string' || action === '' ||
          typeof button !== 'string' || button === ''
        ) {
          console.error(
            `Action definitions should not be null, undefined, or empty ` +
            `strings. Debug info: action='${action}', 'button=${button}'`
          );
          errors++;
        }
        else if (!Array.isArray(modeSchema) || !modeSchema.includes(action)) {
          console.error(
            `[287] Mode "${mode}" does not have action "${action}" defined` +
            'in the schema. This means that it won\'t show up in controls ' +
            `menu! Please add "${action}" to \`controls.js\` -> \`keySchema\`. ` +
            `If it's not meant to show up in the controls menu, name it ` +
            `"_${action}" instead. ` +
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
