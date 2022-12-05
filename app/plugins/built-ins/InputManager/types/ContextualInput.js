import _ from 'lodash';
import { controls } from '../../../../local/controls';
import CbQueue from '../../../../local/CbQueue';

// Used to prevent spamming key events by keeping track of what's currently
// pressed.
// const heldButtons = new Array(4000).fill(false);
const heldButtons = {};
// Used to keep track of ongoing actions (in other words button-to-action
// conversions).
const ongoingActions = {};

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
export default function ContextualInput(stringName) {
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
// Actions that currently cannot be performed.
ContextualInput._blockedActions = {};
// Allow browser to react to browser events. These normally mess with the game,
// but is useful for things like text inputs.
ContextualInput._allowBubbling = false;
/**
 * String containing a mode names. If it contains names, the mode matching the
 * last element will receive key input. No other modes will receive input. If
 * empty, all modes receive input unless there's an override elsewhere.
 * @type {string[]}
 * @private
 */
ContextualInput._exclusiveControl = [];

ContextualInput.initListeners = function() {
  const listener = ContextualInput.universalEventListener;
  window.addEventListener('keydown', listener);
  window.addEventListener('keyup', listener);
  window.addEventListener('mousedown', listener, false);
  window.addEventListener('mouseup', listener, false);
  // Note: we can add { passive: false } in future if we want to preventDefault
  // in scrolling.
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

// Redirects all input to this listener.
ContextualInput.rawInputListener = null;

/**
 * Sets a raw input listener. Only one raw input listener can be active at a
 * time. This used should be used for most things; it's currently used
 * exclusively by the controls menu to change control bindings.
 * @param callback
 */
ContextualInput.setRawInputListener = function(callback) {
  ContextualInput.rawInputListener = callback;
};

/**
 * Remove the current rawInputListener and restored normal key functionality.
 */
ContextualInput.clearRawInputListener = function() {
  ContextualInput.rawInputListener = null;
};

/**
 * Gets the mode that currently holds key exclusivity. Returns null if no modes
 * currently have exclusivity.
 * @returns {null|string}
 */
ContextualInput.getExclusiveControlMode = function getExclusiveControlMode() {
  const exclusiveModes = ContextualInput._exclusiveControl;
  if (exclusiveModes.length === 0) {
    return null;
  }
  else {
    return exclusiveModes[exclusiveModes.length - 1];
  }
};

/**
 * Gives a mode exclusive control. If more than one mode has exclusivity, only
 * the latest added will receive control.
 * @param modeName
 */
ContextualInput.setExclusiveControlMode = function setExclusiveControlMode(modeName) {
  ContextualInput._exclusiveControl.push(modeName);
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
};

/**
 * Signalled when a mode is changed to a different mode controller.
 * @param callback
 */
ContextualInput.prototype.onControlChange = function onControlChange(callback) {
  this._changeControlListeners.register(callback);
};

ContextualInput.prototype.removeControlListener = function removeControlListener(callback) {
  this._changeControlListeners.deregister(callback);
};

/**
 * Signalled when a mode is changed to a different mode controller.
 * TODO: check if this is still needed. Might need to remove.
 * @param callback
 */
ContextualInput.prototype.onGlobalControlChange = function onGlobalControlChange(callback) {
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
 * allowed only one callback per action. That is, registering the same name
 * again replaces the previous.
 * @param {string} actionName
 * @param {ActionType} actionType
 * @param {number} modeName
 * @param {function} callback
 */
ContextualInput.prototype.replaceAction = function onModeAction(
  { actionName, actionType=ActionType.any, modeName, callback }
) {
  // Listener for controls.
  ContextualInput._listeners[`${this._name}.${modeName}.${actionName}`] = {
    actionType,
    callback,
  };
};

/**
 * Registers listeners for the specified actions. Please not that every
 * enrolled child is allowed only one callback per action. That is, registering
 * the same name again replaces the previous.
 * @param {string[]} actionNames
 * @param {ActionType} actionType
 * @param {number} modeName
 * @param {function} callback
 */
ContextualInput.prototype.replaceActions = function onModeAction(
  { actionNames, actionType, modeName, callback }
) {
  for (let i = 0, len = actionNames.length; i < len; i++) {
    this.replaceAction({ actionName: actionNames[i], actionType, modeName, callback });
  }
};

/**
 * Intended to be used by external function for convenience, ex. from the API.
 * @param action
 * @param analogData
 * @param isDown
 * @param forceNotify
 */
ContextualInput.triggerAction = function triggerAction(
  { action, analogData, isDown=true, forceNotify=false }
) {
  const active = ContextualInput._activeInstances;
  const activeKeys = Object.keys(active);
  let foundListener = false;
  for (let i = 0, len = activeKeys.length; i < len; i++) {
    const modeInst = active[activeKeys[i]];
    if (modeInst._activeChild) {
      if (ContextualInput.notifyMode({
        action, isDown, analogData, modeInst, noImplWarn: true, forceNotify,
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
 * @returns {boolean} True if a valid target was found, false otherwise.
 */
ContextualInput.notifyMode = function notifyMode({ action, isDown, analogData, modeInst, noImplWarn, forceNotify=false }) {
  if (ContextualInput._blockedActions[action]) {
    // Break out if action has been blocked.
    return false;
  }

  const modeName = modeInst._name;
  const modeActiveChild = modeInst._activeChild;
  const exclusiveControl = ContextualInput.getExclusiveControlMode();

  // This allows is to force isUp triggers when a mode receives exclusivity.
  if (isDown) {
    ongoingActions[action] = true;
  } else {
    delete ongoingActions[action];
  }

  // Check for exclusive control. Do not apply exclusivity to key up events.
  if (!forceNotify && exclusiveControl && exclusiveControl !== modeActiveChild) {
    return false;
  }

  // Listener for controls.
  const target = ContextualInput._listeners[`${modeName}.${modeActiveChild}.${action}`];
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
    const message = `'${modeName}.${modeActiveChild}.${action}'`;
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

  if (!activeActions) {
    return console.error(`controls[${modeInst._activeChild}] is undefined.`);
  }
  action = activeActions[key];
  if (action) {
    ContextualInput.notifyMode({ action, isDown, analogData, modeInst });
  }
};

ContextualInput.propagateInput = function propagateInput({ key, isDown, analogData }) {
  if (ContextualInput.rawInputListener) {
    // If a rawInputListener is set, send all input there instead.
    return ContextualInput.rawInputListener({ key, isDown, analogData });
  }

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
 * Allow browser to react to browser events. These normally mess with the game,
 * but is useful for things like text inputs.
 */
ContextualInput.enableBubbling = function enableBubbling() {
  ContextualInput._allowBubbling = true;
};

/**
 * Disables event bubbling. Off by default.
 */
ContextualInput.disableBubbling = function disableBubbling() {
  ContextualInput._allowBubbling = false;
};

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

  const type = event.type;

  // Stop the browser messing with anything game related. This prevent bugs
  // like arrows unintentionally scrolling the page. Bubbling is generally only
  // enabled when a dialog with an input field takes priority. Wheel throws
  // error unless passive is set (which currently is unhelpful) so we skip
  // wheel.
  if (!ContextualInput._allowBubbling && type !== 'wheel') {
    // We need to check if truthy because pointerLock doesn't implement
    // preventDefault.
    // TODO: this has the shitty side-effect of disabling text selection.
    //  We *do* need code though because it prevents default behaviour that
    //  causes many other bugs. Maybe see if you can detect if the target is
    //  modal etc, and don't prevent in this cases. REPORT AS BUG.
    if (event.preventDefault) {
      event.preventDefault();
    }
  }

  let isDown = true;
  // If true, a button will never signal a key up. This is a requirement for
  // mouse wheel scrolls.
  let isNeverHeld = false;
  // This never trigger key up signals and are handled separately.
  let analogData = null;

  switch (type) {
    case 'keypress':
    case 'click':
      // Don't use built-in presses as they don't fire for all possible keys.
      // https://developer.mozilla.org/en-US/docs/Web/API/Document/keydown_event
      // Luckily, manually dealing with keypresses are easy anyway.
    case 'mousemove':
      // TODO: implement me as plugin
      if (!window.warnedAboutPtrMissing563) {
        window.warnedAboutPtrMissing563 = true;
        console.warn('[ContextualInput] pointer lock controls are not currently set up correctly.');
      }
      // if (!$game.ptrLockControls || !$game.ptrLockControls.isPointerLocked) {
      //   // Ignore mouse if pointer is being used by menu.
      //   return;
      // }
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
      key = keyFromWheelDelta(event.deltaY);
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
        // delete heldButtons[key];
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
};

/**
 * Specified action will be ignored entirely; no modes will receive them at
 * all.
 */
ContextualInput.blockAction = function blockAction({ action }) {
  ContextualInput._blockedActions[action] = true;
};

/**
 * Unblocks a previously blocked action.
 */
ContextualInput.unblockAction = function blockAction({ action }) {
  delete ContextualInput._blockedActions[action];
};

/**
 * Prevents all other modes from receiving input.
 */
ContextualInput.takeFullExclusivity = function takeFullExclusivity({ mode }) {
  console.log(`Granting exclusive key control to ${mode}.`);
  ContextualInput.setExclusiveControlMode(mode);

  // If holding a key while exclusivity is granted, keyUps won't be triggered
  // because exclusivity blocks all key events to non-exclusive modes. This
  // results in controls appearing buggy. We fix this by manually triggering
  // all keyUp events for currently held buttons.
  const keys = Object.keys(ongoingActions);
  for (let i = 0, len = keys.length; i < len; i++) {
    const action = keys[i];
    // console.log(`=> triggering: action: ${action}, isDown: false, forceNotify: true`)
    ContextualInput.triggerAction({
      action, isDown: false, forceNotify: true,
    });
  }
};

/**
 * Prevents all other modes from receiving input.
 */
ContextualInput.relinquishFullExclusivity = function relinquishFullExclusivity({ mode }) {
  const exclusiveControl = ContextualInput._exclusiveControl;
  // Loop backwards and remove the most recent mode to request exclusivity.
  for (let i = exclusiveControl.length - 1; i > -1; i--) {
    const entry = exclusiveControl[i];
    if (entry === mode) {
      return exclusiveControl.splice(i, 1);
    }
  }
};

/**
 * Prevents input going to specified mode.
 * @param target
 */
ContextualInput.disableTargetInstance = function disableTargetInstance(target) {
  // TODO: implement me (or remove it if not needed by the time core menus are
  //  done).
};

/**
 * Request exclusive control over a keys that match the specified action.
 */
ContextualInput.takeActionExclusivity = function takeActionExclusivity({ mode, action }) {
  // TODO: implement me (or remove it if not needed by the time core menus are
  //  done).
};

// --------------------------------------------------------------------------

// // Player cam controller.
// const camController = new ContextualInput('camController');
//
// // Used where a full-blown category is too much.
// const misc = new ContextualInput('misc');
//
// // The main menu, the pause menu, and inventory screen are primary menus.
// const menuController = new ContextualInput('menuController');
//
// // Interactive in-game menu (such as menus of spaceships and computers).
// const virtualMenu = new ContextualInput('virtualMenu');
//
// // Note: you'll notice we have an allModes mode in controls, yet it's not
// // specified here. That's because allModes is an internal mode that literally
// // means 'all modes', and is handled specially. allModes actually represents
// // all the modes in this array.
// ContextualInput.activateInstances([
//   misc,
//   camController,
//   menuController,
//   virtualMenu,
// ]);
//
// // Used for F12 debugging. Do not use in code.
// window.debug.mode = {
//   initListeners: ContextualInput.initListeners,
//   misc,
//   camController,
//   menuController,
// };
//
// const init = ContextualInput.initListeners;
//
// export default {
//   ContextualInput,
//   init,
//   ActionType,
//   misc,
//   camController,
//   menuController,
// }
//
// // Why must we live just to suffer.
// // This thing of having to export twice for import convenience is bullshit.
// // TODO: do research on possible ways around the copy-paste. Then apply
// //  project-wide.
// export {
//   ContextualInput,
//   init,
//   ActionType,
//   misc,
//   camController,
//   menuController,
// }
