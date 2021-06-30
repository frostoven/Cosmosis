import _ from 'lodash';
import { controls } from './controls';
import CbQueue from './CbQueue';

// Used to prevent spamming key events by keeping track of what's currently
// pressed.
// const heldButtons = new Array(4000).fill(false);
const heldButtons = {};

// Used to prevent console spam.
let nothingImplementsWarnings = {};
// Used to clear nothingImplementsWarnings after a small delay.
let nothingImplementsTimer = null;

/** Give mouse 1-3 friendlier names. */
const mouseFriendly = [
  'Left', 'Middle', 'Right',
];

let prevMouseX = 0;
let prevMouseY = 0;

let prevControllerX = 0;
let prevControllerY = 0;

/**
 * @enum {AnalogSource}
 * @type {{mouse: number, controller: number}}
 */
const AnalogSource = {
  mouse: 2,
  controller: 4,
};

let _actionEnum = 1;
/**
 * All different types of actions that can be performed.
 * Note that actions are in powers of 2 and can therefore for bitmasked (i.e
 * you may specify more than one type at a time by bit-ANDing them together).
 * @type {{keyUp: number, analogMove: number, keyDown: number, keyPress: number}}
 * @enum {ActionType}
 */
const ActionType = {
  // Signals with any event.
  any: 2 ** _actionEnum++,
  // Signalled when a key is pressed. This may be a keyboard button, a mouse
  // button, gamepad controller button, etc.
  keyDown: 2 ** _actionEnum++,
  // Signalled when a key has been pressed and released. This may be a keyboard
  // button, a mouse button, gamepad controller button, etc.
  keyPress: -1,
  // Signalled when a key is released. This may be a keyboard button, a mouse
  // button, gamepad controller button, etc.
  keyUp: 2 ** _actionEnum++,
  // Signalled when a mouse or gamepad analog stick's coordinates change.
  analogMove:  2 ** _actionEnum++,
};

// Technical note: from a purely logical point of view, keyDown and
// keyPress is identical. The only difference between the two is that we
// should always expect a keyUp after a keyDown, whereas with keyPress
// the event chain is done once keyPress has triggered. We keep both for
// readability and organisational purposes more than anything else.
ActionType.keyPress = ActionType.keyDown;

// --------------------------------------------------------------------------

/**
 * ContextualInput is used by pieces of logic called modes. At it's core, a
 * mode is a discrete unit of code capable of handling high-level input.
 * High-level here means actions, rather than keys. For instance, a mode may
 * listen for 'moveForward', but will never listed for 'KeyW'.
 *
 * Modes have the ability to receive input in tandem with other modes, request
 * input priority, or request input be completely cut off for other mode
 * altogether.
 *
 * Everything from camera controllers to pause menus are modes. Mode logic is
 * what allows you to, for example, run around in the game world despite having
 * a menu open.
 *
 * Mutually exclusive modes (such as cam controllers) should all use a single
 * ContextualInput instance and switch between who has control. Co-habitable
 * modes (such as a cam controller and a menu) should use separate instances.
 * @constructor
 */
function ContextualInput(stringName) {
  if (!stringName) {
    throw 'ContextualInput() needs a string name for identification purposes.';
  }
  this._name = stringName;
  this._activeChild = null;
  this._enrolledChildren = {};
  this._changeControlListeners = new CbQueue();
  this._globalControlListeners = new CbQueue();
}

// Mode that currently receive input.
ContextualInput._activeInstances = {};
// Used to keep track of unique names among modes.
ContextualInput._reservedChildIds = {};
// Used internally to store action callbacks.
ContextualInput._listeners = {};

ContextualInput.initListeners = function() {
  const listener = ContextualInput.universalEventListener;
  window.addEventListener('keydown', listener);
  window.addEventListener('keyup', listener);
  window.addEventListener('mousedown', listener, false);
  window.addEventListener('mouseup', listener, false);
  window.addEventListener('wheel', listener, false);
  window.addEventListener('mousemove', listener, false);
  window.addEventListener('pointerlockchange', listener, false);
};

ContextualInput.activateInstances = function(additions) {
  const instances = ContextualInput._activeInstances;
  for (let i = 0, len = additions.length; i < len; i++) {
    const inst = additions[i];
    if (!instances[inst._name]) {
      instances[inst._name] = inst;
    }
  }
};

/**
 * Grants control to the specified child.
 * @param {string} childId - The numeric child ID.
 */
ContextualInput.prototype.giveControlTo = function giveControlTo(childId) {
  this._changeControlListeners.notifyAll({
    previous: this._activeChild,
    next: childId,
  });
  this._activeChild = childId;
};

/**
 * Alias of giveControlTo.
 * @param {number} childId - The numeric child ID.
 */
ContextualInput.prototype.takeControl = ContextualInput.prototype.giveControlTo;

ContextualInput.prototype.getActiveMode = function getActiveMode() {
  return this._activeChild;
}

/**
 * Signalled when a mode is changed to a different reality controller.
 * @param callback
 */
ContextualInput.prototype.onControlChange = function onControlChange(callback) {
  this._changeControlListeners.register(callback);
};

ContextualInput.prototype.removeControlListener = function removeControlListener(callback) {
  this._changeControlListeners.deregister(callback);
};

/**
 * Signalled when a mode is changed to a different reality controller.
 * @param callback
 */
ContextualInput.prototype.onGloablControlChange = function onGloablControlChange(callback) {
  this._globalControlListeners.register(callback);
};

ContextualInput.prototype.removeGlobalControlListener = function removeGlobalControlListener(callback) {
  this._globalControlListeners.deregister(callback);
};

/**
 * Returns a value that the child can use to identify themselves with.
 * @param {string} modeName
 * @param {boolean} [autoActivate]
 * @returns string
 */
ContextualInput.prototype.enroll = function enrollChild(modeName, autoActivate) {
  if (ContextualInput._reservedChildIds[modeName]) {
    throw `Error: child with name '${modeName}' has already been enrolled.`;
  }
  ContextualInput._reservedChildIds[modeName] = true;
  this._enrolledChildren[modeName] = {};

  if (autoActivate) {
    this.giveControlTo(modeName);
  }

  return modeName;
};

/**
 * Removes specified child from enrollment list.
 */
ContextualInput.prototype.disenroll = function enrollChild(childId) {
  if (this._activeChild === childId) {
    this._activeChild = null;
  }
  delete this._enrolledChildren[childId];
};

/**
 * Registers a listener for an action. Please not that every enrolled child is
 * allowed only one callback per action.
 * @param {string} actionName
 * @param {ActionType} actionType
 * @param {number} modeName
 * @param {function} callback
 */
ContextualInput.prototype.onAction = function onModeAction(
  { actionName, actionType=ActionType.any, modeName, callback }
) {
  // Listener for controls.
  ContextualInput._listeners[`${this._name}.${modeName}.${actionName}`] = {
    actionType,
    callback,
  };
};

/**
 *
 * @param {string[]} actionNames
 * @param {ActionType} actionType
 * @param {number} modeName
 * @param {function} callback
 */
ContextualInput.prototype.onActions = function onModeAction(
  { actionNames, actionType, modeName, callback }
) {
  for (let i = 0, len = actionNames.length; i < len; i++) {
    this.onAction({ actionName: actionNames[i], actionType, modeName, callback });
  }
};

/**
 * Intended to be used by external function for convenience, ex. from the API.
 * @param action
 * @param analogData
 */
ContextualInput.triggerAction = function triggerAction({ action, analogData }) {
  const active = ContextualInput._activeInstances;
  const activeKeys = Object.keys(active);
  let foundListener = false;
  for (let i = 0, len = activeKeys.length; i < len; i++) {
    const modeInst = active[activeKeys[i]];
    if (modeInst._activeChild) {
      if (ContextualInput.notifyMode({
        action, isDown: true, analogData, modeInst, noImplWarn: true
      })) {
        // Note: we ignore false because something will almost always return
        // false. We're specifically looking for the absence 'true' being
        // returned.
        foundListener = true;
      }
    }
  }
  if (!foundListener) {
    console.warn(`Couldn't find a controller that implements action '${action}'.`);
  }
};

/**
 * @returns {boolean} True if a valid target was found, false oherwise.
 */
ContextualInput.notifyMode = function notifyMode({ action, isDown, analogData, modeInst, noImplWarn }) {
  // Listener for controls.
  const target = ContextualInput._listeners[`${modeInst._name}.${modeInst._activeChild}.${action}`];
  if (target) {
    const { callback, actionType } = target;

    // Note: the single '&' is intentional because this is a bitwise
    // operation.
    if (actionType & ActionType.any) {
      callback({ action, isDown, analogData });
    }
    else if (analogData && actionType & ActionType.analogMove) {
      callback({ action, isDown, analogData });
    }
    else if (isDown) {
      // Note: keyDown and keyPressed uses the same constant, so we only
      // check for one of them.
      if (actionType & ActionType.keyDown) {
        callback({ action, isDown, analogData });
      }
    }
    else if (actionType & ActionType.keyUp) {
      callback({ action, isDown, analogData });
    }
    return true;
  }
  else if (!noImplWarn) {
    // Listener for controls.
    const message = `'${modeInst._name}.${modeInst._activeChild}.${action}'`;
    // This ensures we don't spam the console.
    if (!nothingImplementsWarnings[message]) {
      nothingImplementsWarnings[message] = true;
      console.warn('Nothing implements:', message);
    }
    // Resume the spam after a small delay.
    if (!nothingImplementsTimer) {
      nothingImplementsTimer = _.debounce(() => {
        nothingImplementsWarnings = [];
      }, 3000);
    }
    nothingImplementsTimer();
    return false;
  }
};

ContextualInput.notifyOfInput = function notifyOfInput({ key, isDown, analogData, modeInst }) {
  const inheritedActions = controls.allModes;
  const activeActions = controls[modeInst._activeChild];

  let action = inheritedActions[key];
  if (action) {
    ContextualInput.notifyMode({ action, isDown, analogData, modeInst });
  }

  action = activeActions[key];
  if (action) {
    ContextualInput.notifyMode({ action, isDown, analogData, modeInst });
  }
};

ContextualInput.propagateInput = function propagateInput({ key, isDown, analogData }) {
  const activeInstances = ContextualInput._activeInstances;
  const activeInstKeys = Object.keys(ContextualInput._activeInstances);

  for (let i = 0, len = activeInstKeys.length; i < len; i++) {
    const modeInst = activeInstances[activeInstKeys[i]];
    // Only check controls if the target has an active child, which may not be
    // the case. For example, if all menus are closed, there will be no active
    // child menus.
    if (modeInst._activeChild) {
      ContextualInput.notifyOfInput({ key, isDown, analogData, modeInst });
    }
  }
};

/**
 * @param {number} x
 * @param {number} y
 * @param {AnalogSource} source
 */
function calculateAnalogData(x, y, source) {
  let prevX = source === AnalogSource.mouse ? prevMouseX : prevControllerX;
  let prevY = source === AnalogSource.mouse ? prevMouseY : prevControllerY;

  let deltaX = x - prevX;
  let deltaY = y - prevY;

  let results = {
    x: {
      // key: set below.
      delta: x, invDelta: y,
      gravDelta: deltaX, gravInvDelta: deltaY,
    },
    y: {
      // key: set below.
      delta: y, invDelta: x,
      gravDelta: deltaY, gravInvDelta: deltaX,
    },
  };

  // Below: sp means 'special'. Or 'somewhat promiscuous'. Whatever. Used to
  // indicate the 'key' is non-standard.
  if (x > prevX) { results.x.key = 'spEast'; }
  else if (x < prevX) { results.x.key = 'spWest'; }

  if (y > prevY) { results.y.key = 'spSouth'; }
  else if (y < prevY) { results.y.key = 'spNorth'; }

  if (source === AnalogSource.mouse) {
    prevMouseX = x;
    prevMouseY = y;
  }
  else {
    prevControllerX = x;
    prevControllerY = y;
  }

  return results;
}

/**
 * Receives any/all browser input and translates those into simple 'action x
 * happened' callbacks.
 * @param event
 */
ContextualInput.universalEventListener = function(event) {
  // Note: code is retained for keyboard events, but modified for other event
  // types. For example, mouse click left will be stored as code=spMouseLeft
  // (sp is short for 'special').
  let key = event.code;

  let isDown = true;
  // If true, a button will never signal a key up. This is a requirement for
  // mouse wheel scrolls.
  let isNeverHeld = false;
  // This never trigger key up signals and are handled separately.
  let analogData = null;

  switch (event.type) {
    case 'keypress':
    case 'click':
      // Don't use built-in presses as they don't fire for all possible keys.
      // https://developer.mozilla.org/en-US/docs/Web/API/Document/keydown_event
      // Luckily, manually dealing with keypresses are easy anyway.
      return;
    case 'mousemove':
      analogData = calculateAnalogData(
        event.movementX, event.movementY, AnalogSource.mouse
      );
      break;
    case 'mousedown':
      key = `spMouse${mouseFriendly[event.button]}`;
      break;
    case 'mouseup':
      key = `spMouse${mouseFriendly[event.button]}`;
      // Note: fallthrough is intentional here.
    case 'keyup':
      isDown = false;
      break;
    case 'wheel':
      // Note: a wheel scroll is always classed as a press.
      isNeverHeld = true;
      key = keyFromWheelDelta(event.deltaY)
      if (!key) {
        // TODO: check if returning out after zero is bad thing. Maybe we need it for resets.
        return;
      }
      break;
  }

  if (analogData) {
    // Analog events very little bureaucracy involved. Simply trigger for each
    // axis and call it a day.
    ContextualInput.propagateInput({ key: analogData.x.key, isDown, analogData });
    ContextualInput.propagateInput({ key: analogData.y.key, isDown, analogData });
  }
  else {
    // All other kinds of events covered in this block.

    if (!isNeverHeld) {
      // Prevent event spam by keeping track of which buttons are currently held
      // down.
      if (!isDown) {
        heldButtons[key] = false;
      } else {
        if (heldButtons[key]) {
          return;
        }
        heldButtons[key] = true;
      }
    }

    ContextualInput.propagateInput({ key, isDown });

    // Immediately trigger a button release for buttons that cannot be held (such
    // as scroll wheels).
    if (isNeverHeld) {
      ContextualInput.propagateInput({ key: key, isDown: false });
    }
  }
}

/**
 * Returns spScrollDown or spScrollUp. Returns null if delta is 0.
 * @param {number} deltaY
 * @returns {string|null}
 */
function keyFromWheelDelta(deltaY) {
  if (deltaY === 0){
    return null;
  } else if (deltaY > 0) {
    // Scrolling down.
    return 'spScrollDown';
  } else {
    // Scrolling up.
    return 'spScrollUp';
  }
}

// ---- TODO: implement these 4 functions -----------------------------------

/**
 * Specified action will be ignored entirely; no modes will receive them at
 * all.
 */
ContextualInput.blockAction = function blockAction(action) {
  //
}

/**
 * Request exclusive access over a key.
 */
ContextualInput.takeKeyExclusivity = function takeKeyExclusivity(key) {
  //
};

/**
 * Prevents all other modes from receiving input.
 */
ContextualInput.takeFullExclusivity = function takeFullExclusivity() {
  // then 'grantAccessTo' gets full control.
};

/**
 * Prevents input going to specified mode.
 * @param target
 */
ContextualInput.disableTargetInstance = function disableTargetInstance(target) {
  //
};

// --------------------------------------------------------------------------

// Player cam controller.
const camController = new ContextualInput('camController');

// Used where a full-blown category is too much.
const misc = new ContextualInput('misc');

// The main menu, the pause menu, and inventory screen are primary menus.
const primaryMenu = new ContextualInput('primaryMenu');

// TODO: make primary and secondary mutually exclusive? (probably, yes.)
// Any menu opened as a child of another menu is a submenu.
const submenu = new ContextualInput('submenu');

// Interactive in-game menu (such as menus of space ships and computers).
const virtualMenu = new ContextualInput('virtualMenu');

// Note: you'll notice we have an allModes mode in controls, yet it's not
// specified here. That's because allModes is an internal mode that literally
// means 'all modes', and is handled specially. allModes literally represents
// all the modes in this array.
ContextualInput.activateInstances([
  misc,
  camController,
  primaryMenu,
  submenu,
  virtualMenu,
]);

// Used for F12 debugging. Do not use in code.
window.debug.mode = {
  initListeners: ContextualInput.initListeners,
  misc,
  camController,
  primaryMenu,
  submenu,
};

export default {
  ContextualInput,
  init: ContextualInput.initListeners,
  ActionType,
  misc,
  camController,
  primaryMenu,
  submenu,
}
