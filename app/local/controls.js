import { addSpacesBetweenWords, toTitleCase } from './utils';
import _ from 'lodash';
import userProfile from '../userProfile';

// Stores the inverse of the control mapping relationships.
let cachedInverseSchema = null;

// Control cache. This object should never be copied because the user may
// change their controls at any time.
// Uses `event.code` for keyboard, and special keywords for other types. Easy
// reference: https://keycode.info/
// ---
// Technical terms inside this object:
// const controls = {
//   modeName: {
//     buttonName: 'actionName',
//   },
// };
let controls;
// Double-press control cache. This is a setting that allows the user to force
// assigning the same key to multiple actions within the same mode. This object
// should never be copied because the user may change their controls at any
// time. It's niche, but I aim to please, baby.
// TODO: implement me. #47
let doublePresses;

// Load controls from profile. This will run at boot, and every time the user
// remaps their controls.
userProfile.addCacheListener(({ controls: storedControls }) => {
  controls = storedControls.controls;
  doublePresses = storedControls.doublePresses;
});

// Contains all possible in-game actions for each game mode. Note that the
// keySchema is very important because it easily allows the controls menu to
// figure it if a key is unbound, among other uses. The keySchema is validated
// during integration tests and should always be updated prior to committing
// new control code.
const keySchema = {
  allModes: [
    // 'showKeyBindings',
  ],
  general: [
    '_devChangeCamMode',
    'toggleMousePointer', // a.k.a. PointerLockControls.
    'toggleFullScreen',
    'showDevConsole',
  ],
  menuViewer: [
    'back',
    'select',
    'saveChanges',
    'up',
    'down',
    'left',
    'right',
    'delete',
    'manageMacros',
    'advanced',
    // Goes straight back to the game, regardless of how deeply nested the menu
    // is. It then attempts to lock the cursor.
    'emergencyMenuClose',
  ],
  shipPilot: [
    'thrustInc',
    'thrustDec',
    'thrustReset',
    'debugFullWarpSpeed',
    'thrustUp10',
    'toggleMouseSteering',
    'rollLeft',
    'rollRight',
    'engageHyperdrive',
    'pitchUp',
    'pitchDown',
    'yawLeft',
    'yawRight',
    'toggleFlightAssist',
    'cycleExternalLights',
    'cycleInternalLights',
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
    'rollLeft',
    'rollRight',
    'speedUp',
    'speedDown',
    'use',
    'doubleSpeed',
    'interact',
    'pitchUp',
    'pitchDown',
    'yawLeft',
    'yawRight',
  ],
  godCam: [
    'pitchUp',
    'pitchDown',
    'yawLeft',
    'yawRight',
    'zoomIn',
    'zoomOut',
  ],
};

const metadata = {
  allModes: {
    // This became almost entirely redundant after general was added.
    // TODO: consider removing allModes. Note that it's the only way to share
    //  unique action names between modes, so we might still find a use for it.
    description: 'Keys inherited by multiple modes.',
  },
  general: {
    description: 'Controls that may be activated from almost everywhere.',
  },
  menuViewer: {
    description: 'The in-game menu.',
    displayName: 'menu',
    // TODO: implement this. If binding a control would leave a required
    //  control with zero bindings, refuse to continue with this message:
    //  Error
    //  Setting this would leave [action] with no bindings. Doing that will
    //   render the game unusable. Please add additional bindings to [action]
    //   to set this binding to [key].
    requiredControls: [ 'select' ],
  },
  shipPilot: {
    description: 'Mode used when user is locked to seat.',
  },
  freeCam: {
    // TODO: remove the F8 text once it becomes an independent feature.
    description: 'Free flying camera (press F8 to activate).',
  },
  godCam: {
    description: 'Celestial god cam',
  },
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
  'ArrowUp': 'Up arrow',
  'ArrowLeft': 'Left arrow',
  'ArrowRight': 'Right arrow',
  'ArrowDown': 'Down arrow',
  //
  'ShiftLeft': 'Left Shift',
  'ShiftRight': 'Right Shift',
  'ControlLeft': 'Left Ctrl',
  'ControlRight': 'Right Ctrl',
  'AltLeft': 'Left Alt',
  'AltRight': 'Right Alt',
  //
  'Mouse20': 'Mega mouse button',
  'spMouseMiddle': 'Middle mouse button',
  'spScrollUp': 'Mouse scroll up',
  'spScrollDown': 'Mouse scroll down',
};

/**
 * Produces an object that returns controls as an 'action=["Key1", "Key2"]'
 * structure. Returns metadata as a separate object.
 * @param {boolean} [invalidateCache] - If true, rebuilds the inverse schema.
 * @returns {{metaData: {}, inverseActionSchema: {}}}
 */
function getInverseSchema(invalidateCache=false) {
  if (invalidateCache) {
    cachedInverseSchema = null;
  }
  if (cachedInverseSchema) {
    return cachedInverseSchema;
  }
  const metaData = {};
  const inverseActionSchema = {};
  _.each(controls, (section, sectionName) => {
    _.each(section, (action, control) => {
      // Controls starting with underscores are not controls, but rather
      // metadata. Save, and then skip.
      if (control.charAt(0) === '_') {
        if (!metaData[sectionName]) {
          metaData[sectionName] = {};
        }
        metaData[sectionName][control] = action;
        return;
      }

      // Ensure we can nest our controls by creating the appropriate
      // structures.
      if (!inverseActionSchema[sectionName]) {
        inverseActionSchema[sectionName] = {};
      }
      if (!inverseActionSchema[sectionName][action]) {
        inverseActionSchema[sectionName][action] = [];
      }

      // Save the control.
      inverseActionSchema[sectionName][action].push(control);
    });
  });

  cachedInverseSchema = { metaData, inverseActionSchema };
  return cachedInverseSchema;
}

function invalidateInverseSchemaCache() {
  cachedInverseSchema = null;
}

/**
 * Converts a keymap name to a friendlier name that can be displayed to the
 * user.
 * Note: this function is slow; please don't run it every frame.
 * @param {number|string} key - The key you want a name for.
 */
function keymapFriendlyName(key) {
  // Get a predefined name, if it exists, and return it.
  const predefined = friendlierKeyName[key];
  if (predefined) {
    return predefined;
  }

  // Put spaces between words.
  let result = addSpacesBetweenWords(key);

  // Uppercase each word.
  result = toTitleCase(result);

  // Change things like 'Key J' to 'J'.
  result = result.replace(/^Key /, '');

  // Change things like 'Numpad5' with 'Num5'.
  result = result.replace(/^Numpad/, 'Num');

  return result;
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

// TODO: write tests that ensure actions in allModes are unique to all controls.
//  Specifically, actions are not unique between other modes (ex. freeCam and
//  godCam), but allModes actions get injected into all other modes, so has to be
//  unique.

// Used for console debugging.
debug.getControls = () => controls;
// Used for console debugging.
debug.keySchema = keySchema;

export {
  tests,
  controls,
  doublePresses,
  keySchema,
  metadata,
  keymapFriendlyName,
  getInverseSchema,
  invalidateInverseSchemaCache,
};
