import _ from 'lodash';
import ChangeTracker from 'change-tracker/src';
import userProfile from '../../../../userProfile';
import { gameRuntime } from '../../../gameRuntime';
import { InputManager } from '../index';
import { ModeId } from './ModeId';
import { ActionType } from './ActionType';
import { ControlSchema } from '../interfaces/ControlSchema';
import { arrayContainsArray, capitaliseFirst } from '../../../../local/utils';
import { InputType } from '../../../../configs/types/InputTypes';
import {
  chaseValue,
  clamp,
  easeIntoExp,
} from '../../../../local/mathUtils';
import { InputUiInfo } from '../interfaces/InputSchemeEntry';
import {
  BasicActionData,
  FullActionData,
  ReceiverActionData,
} from '../interfaces/ActionData';
import Core from '../../Core';

const animationData = Core.animationData;

// TODO: move to user configs, and expose to UI. Minimum value should be zero,
//  and max should be 0.95 to prevent bugs.
// On a scale from 0-1, how sensitive should buttons such as gamepad triggers
// be? Note this math is also used for keyboard button to simplify things. This
// value works well for both xbox controllers and ps controllers. Note that
// this only applies to digital actions such as toggles, and not to continuous
// actions such as throttles.
const ANALOG_BUTTON_THRESHOLD = 0.1;
const ANALOG_STICK_THRESHOLD = 0.25;
// // Note: far away we are from 100% before we just treat it as 100%.
// const ANALOG_STICK_INV_THRESHOLD = 0.05;
// If you push a gamepad stick (xbox, ds, etc.) all the way up, you get 1.0. If
// however you push that same stick 45 degrees up, it sits at ~0.75. This value
// represents that error.
// const ANALOG_STICK_OVERSHOOT = 1.25;

// TODO: move me into user profile.
const ANALOG_STICK_EASING = false;
const SLIDER_EPSILON = 0.01;
const MOUSE_SPEED = 0.7;

export default class ModeController {
  public name: string;
  public modeId: ModeId;
  public controlSchema: ControlSchema;
  public controlsByKey: {};
  public keyLookup: {} = {};
  public remapReceiverLookup: {} = {};
  public uiInfo: InputUiInfo;
  private readonly _actionReceivers: Array<Function>;

  // Passive state. This only changes when something external changes. Stores
  // last known pressed values.
  public absoluteInput: { [action: string]: number };
  // This actively updates this.state. Useful for situations where action is
  // implied (for example a gamepad stick sitting at -1.0 without changing).
  public cumulativeInput: { [action: string]: number };
  // Designed for instant actions and toggleables. Contains change trackers.
  public pulse: { [actionName: string]: ChangeTracker };
  // Used for the mouseAxisGravity mode. Resets the mouse to 0 after a delay.
  private readonly _gravAction: { [action: string]: number } = {};

  // This fixes an issues where, if an analog stick and another device such as
  // the keyboard are mapped to the same action, eg. walk forward, the keyboard
  // action will spontaneously stop working (eg. the player will stop walking
  // even though the walk button is still pressed). This happens because the
  // jitter of a bad stick effectively simulates the equivalent keyboard button
  // being released. This object keeps track of previous analog values. If, by
  // threshold, it was effectively zero the last time it was activated, then
  // the input is ignored instead of being reset in state.
  private readonly _analogFlutterCheck: { [actionName: string]: number };

  /**
   * @param name - Unique identifying this mode.
   * @param modeId - The hierarchical authority/priority of this mode. When two
   *   modes have the same keybinding, the mode with the higher number will
   *   receive the input (for example, menus take priority over ship controls).
   *   Modes with the same modeId are mutually exclusive; for example, helm
   *   control and free-cam have the same priority, and cannot be active at the
   *   same time. Activating one will automatically cause the input system to
   *   deactivate the other.
   * @param controlSchema - Control bindings for this mode.
   * @param uiInfo - Used to generate the controls bindings UI.
   */
  constructor(name: string, modeId: ModeId, controlSchema: ControlSchema, uiInfo: InputUiInfo) {
    this.name = name;
    this.modeId = modeId;
    this.controlSchema = {};
    this.controlsByKey = {};
    this.uiInfo = uiInfo;

    this.absoluteInput = {};
    this.cumulativeInput = {};
    this.pulse = {};
    this._analogFlutterCheck = {};

    const inputTypesNames = Object.values(InputType);
    // Enums always have double the amount entries, so divide by 2.
    this._actionReceivers = Array(inputTypesNames.length / 2);

    // Bind InputType entries to callback functions with names matching those
    // in this class.
    // Note: The indexes of this._actionReceivers MUST match the indexes in
    // InputTypes or things will break.
    for (let i = 0, len = inputTypesNames.length; i < len; i++) {
      const inputTypeId = inputTypesNames[i];
      if (typeof inputTypeId !== 'number') {
        continue;
      }

      if (inputTypeId === 0) {
        // Special case (better readability).
        this._actionReceivers[0] = this.receiveAndIgnore.bind(this);
        continue;
      }

      const inputTypeName: string = InputType[inputTypeId];
      const callbackName = `receiveAs${capitaliseFirst(inputTypeName)}`;
      this._actionReceivers[inputTypeId] = this[callbackName].bind(this);
    }

    if (!name) {
      console.error('ModeController requires a name for lookup purposes.');
      return;
    }
    if (!modeId) {
      console.error(
        'ModeController requires ModeId number. Please have a look at ' +
        'built-in plugins such as FreeCam for examples.',
      );
      return;
    }
    if (!controlSchema) {
      console.error(
        'ModeController requires a ControlSchema object. Please have a look ' +
        'at built-in plugins such as FreeCam for examples.',
      );
      return;
    }

    // Control setup.
    this.extendControlSchema(controlSchema);

    const inputManager: InputManager = gameRuntime.tracked.inputManager.cachedValue;
    inputManager.registerController(this);
    this._setupSchemeLookups();
  }

  _setupSchemeLookups() {
    InputManager.allControlSchemes[this.name] = {
      ...this.uiInfo,
      modeController: this,
      key: this.name,
    };
  }

  // This allows both core code and modders to add their own control bindings.
  extendControlSchema(controlSchema: ControlSchema) {
    const savedControls = userProfile.getCurrentConfig({ identifier: 'controls' }).controls;

    _.each(controlSchema, (control, actionName) => {
      // ---> do not remove this, it's part of the structure below.
      // if (savedControls[actionName]) {

        // TODO: remove me
        if (Array.isArray(control.default)) {
          console.log(`-> skipping ${actionName} - old structure detected.`);
          return;
        }

      //   // TODO: uncomment me, make me work with new system.
      //   // Override default controls with user-chosen ones.
      //   try {
      //     // controlSchema[actionName].current = savedControls[actionName];
      //     controlSchema[actionName].current = { ...savedControls[actionName] };
      //   }
      //   catch (error) {
      //     console.error(`[ModeController] Failed to set key for action '${actionName}'`, error);
      //   }
      // }
      // else {
        // User profile does not have this control stored. Use default.
        try {
          // controlSchema[actionName].current = controlSchema[actionName].default;
          controlSchema[actionName].current = { ...controlSchema[actionName].default };

          // Clone multiplier so that we don't change the original.
          if (controlSchema[actionName].multiplier) {
            controlSchema[actionName].multiplier = { ...controlSchema[actionName].multiplier };
          }
          else {
            controlSchema[actionName].multiplier = {};
          }
          // Fill multiplier with sane default values.
          _.each(InputType, (inputType) => {
            if (typeof inputType !== 'string') {
              return;
            }
            // @ts-ignore - assessment not relevant.
            if (!controlSchema[actionName].multiplier[inputType]) {
              // @ts-ignore - assessment not relevant.
              controlSchema[actionName].multiplier[inputType] = 1;
            }
          });

          if (typeof controlSchema[actionName].disallowSign === 'undefined') {
            controlSchema[actionName].disallowSign = 0;
          }
        }

        catch (error) {
          console.error(`[ModeController] Failed to set key for action '${actionName}'`, error);
        }

      if (controlSchema[actionName].analogRemap) {
        // @ts-ignore - Apparently the very previous line was never written.
        this.remapReceiverLookup[controlSchema[actionName].analogRemap] = true;
      }

      if (!controlSchema[actionName].sign) {
        controlSchema[actionName].sign = 1;
      }
    });


    _.each(controlSchema, (control: ControlSchema['key'], actionName: string) => {
      this.registerControl(control, actionName);
    });

    InputManager.allKeyLookups[this.name] = this.keyLookup;
  }

  registerControl(control: ControlSchema['key'], actionName: string) {
    // Used by parts of the application that want to display the bindings for a
    // particular action, such as tutorials or instructional info blocks.
    const keyLookup = this.keyLookup;

    const allowedConflicts = {};

    InputManager.allKeyLookups[this.name] = keyLookup;
    if (this.controlSchema[actionName]) {
      return console.error(
        `[ModeController] Ignoring attempt to set register control action ` +
        `'${actionName}' in mode ${this.name} - ${this.name} already has `
        + `that action defined for something else.`,
      );
    }

    this.controlSchema[actionName] = {
      // Note that this can possibly be undefined, but that's ok because
      // { ...undefined } is just {}.
      ...this.controlSchema[actionName] as object,
      ...control,
    };
    // console.log(`this.controlSchema[${actionName}] = { ...`, control, '}');


    // Conflicts are rarely allowed in cases where a single mode internally
    // disambiguates conflicts.
    if (control.allowKeyConflicts) {
      if (!allowedConflicts[actionName]) {
        allowedConflicts[actionName] = [];
      }

      _.each(control.allowKeyConflicts, (conflictAction) => {
        if (!allowedConflicts[actionName].includes(conflictAction)) {
          // Example: allowedConflicts['lookUp'] = [ 'pitchUp' ];
          allowedConflicts[actionName].push(conflictAction);
        }

        // Rewrite the conflicting keys to allow conflict with these keys. This
        // allows devs and modders to define allowed conflicts in any order.
        if (!allowedConflicts[conflictAction]) {
          allowedConflicts[conflictAction] = [];
        }
        if (!allowedConflicts[conflictAction].includes(actionName)) {
          // Example: allowedConflicts['pitchUp'] = [ 'lookUp' ];
          allowedConflicts[conflictAction].push(actionName);
        }
      });
    }

    const keys = control.current;
    // The user can assign multiple keys to each action; store them all in
    // controlsByKey individually.
    _.each(keys, (inputType, key) => {
      const ctrlByKey = this.controlsByKey[key];
      // console.log(`-> arrayContainsArray(`, allowedConflicts?.[actionName], `,`, this.controlsByKey[key], `) === `, arrayContainsArray(allowedConflicts?.[actionName], this.controlsByKey[key]));
      if (this.controlsByKey[key] && !arrayContainsArray(allowedConflicts?.[actionName], this.controlsByKey[key])) {
        console.warn(
          `[ModeController] Ignoring attempt to set the same key (${key}) ` +
          `for than one action (${actionName} would conflict with ` +
          `${this.controlsByKey[key]}).`,
          'From:',
          keys,
        );
      }
      else {
        if (!this.controlsByKey[key]) {
          this.controlsByKey[key] = [];
        }
        this.controlsByKey[key].push(actionName);
      }
    });

    const actionType = control.actionType;
    const pulse = ActionType.pulse;
    const continuous = ActionType.continuous;
    const hybrid = ActionType.hybrid;
    //
    if (actionType === pulse || actionType === hybrid) {
      this.pulse[actionName] = new ChangeTracker();
      this.pulse[actionName].setSilent(0);
    }
    //
    if (actionType === continuous || actionType === hybrid) {
      this.absoluteInput[actionName] = 0;
      this.cumulativeInput[actionName] = 0;
    }

    // Save reverse lookup data.
    if (!keyLookup[actionName]) {
      keyLookup[actionName] = [];
    }
    _.each(control.current, (type, key) => {
      // Example result:
      // groupControls.myAction = [{ type: 7, key: 'spNorthSouth', ... }]
      keyLookup[actionName].push({ type, key });
    });
  }

  resetActionBindings(actionName: string, saveChanges = true) {
    const { controlSchema, controlsByKey } = this;
    const oldBindings = controlSchema[actionName].current;
    _.each(oldBindings, (type: InputType, keyCode: string) => {
      this.deleteBinding(actionName, keyCode, false);
    });

    const defaultBindings = controlSchema[actionName].default;
    controlSchema[actionName].current = { ...defaultBindings };
    // this.registerBinding(controlSchema[actionName], actionName, false);
    // _.each(defaultBindings, (type, keyCode) => {
    //   this.registerBinding(keyCode, actionName, false);
    // });

    _.each(defaultBindings, (type, keyCode) => {
      const controlsByKeyIndex = controlsByKey[keyCode].indexOf(actionName);
      if (controlsByKeyIndex === -1) {
        controlsByKey[keyCode].push(actionName);
      }
    });
  }

  deleteBinding(actionName: string, key: string, saveChanges = true) {
    const { controlSchema, controlsByKey } = this;

    // The key schema is used during boot, and when saving controls to disk.
    // Remove the entry being deleted.
    const keyMap = controlSchema[actionName].current;
    keyMap !== null && delete keyMap[key];

    // controlsByKey is used for live lookups. Delete here so we don't need a
    // reboot.
    const controlsByKeyIndex = controlsByKey[key].indexOf(actionName);
    if (controlsByKeyIndex !== -1) {
      controlsByKey[key].splice(controlsByKeyIndex, 1);
    }
  }

  addNewBinding(actionName: string, key: string, type: InputType) {
    const { controlSchema, controlsByKey } = this;

    if (controlSchema[actionName].current === null) {
      controlSchema[actionName].current = {};
    }

    if (!controlsByKey[key]) {
      controlsByKey[key] = [];
    }

    controlSchema[actionName].current![key] = type;
    controlsByKey[key].push(actionName);
  };

  receiveAction({ action, key, value, analogData }: ReceiverActionData) {
    const control = this.controlSchema[action];
    const actionType = control.actionType;
    const sign = control.sign;
    // console.log(`[receiveAction:${action}] control:`, control);

    // @ts-ignore - this is set during init. If not, this point isn't
    // reachable unless by bug.
    let inputType = control.current[key];
    if (!inputType) {
      // If this is hit, then it's probably triggered by API. Keyboard is a
      // very simple choice that should work in all cases, so pretend it's kb.
      inputType = InputType.keyboardButton;
    }

    if (actionType === ActionType.pulse && inputType !== 0) {
      this.handlePulse({ action, value });
      // console.log(`[handlePulse:${action}]`, { value });
    }
    else {
      this._actionReceivers[inputType]({ action, value, analogData, control });
    }
  }

  // --------------------------------------------------------------------------

  // InputType: none
  receiveAndIgnore({ action }: FullActionData) {
    console.log('Received but ignoring', action);
  }

  // Receives a non-pulsed keyboard button.
  // InputType: keyboardButton
  receiveAsKeyboardButton({ action, value, control }: FullActionData) {
    // console.log('[button]', { action, actionType: ActionType[control.actionType], value, control });
    if (control.analogRemap) {
      // TODO: value multipliers should probably go into the control definition
      //  as we probably don't want things being arbitrarily multiplied for no
      //  reason. Maybe call it 'remapMultiplier' to indicate it's only used
      //  for analog remaps.
      // @ts-ignore - See previous comment.
      this.cumulativeInput[control.analogRemap] = value * control.multiplier.keyboardButton * control.sign;

      // TODO: We currently have a bug where if you press two opposing buttons
      //  that are analog remapped at the same time, the one will erase the
      //  other. For example, if you press 'up' and 'down' at the same time,
      //  the last one to pressed will erase the other. Invetigate me.
    }
    else {
      // Under normal circumstances this value is always either 0 or 1.
      this.absoluteInput[action] = value;
    }
    // console.log('Key latency:', performance.now() - InputManager.lastPressTime);
  }

  // InputType: gamepadButton
  receiveAsGamepadButton({ action, value, control }: FullActionData) {
    // console.log('[analog button]', { action, actionType: ActionType[control.actionType], value, control });
    // Under normal circumstances this value is always in range of 0-1.
    if (value < ANALOG_BUTTON_THRESHOLD) {
      value = 0;
    }

    if (control.analogRemap) {
      // @ts-ignore - See comment in receiveAsKeyboardButton.
      this.cumulativeInput[control.analogRemap] = value * control.multiplier.gamepadButton * control.sign;
    }
    else {
      // This has a range of 0 to 1.
      this.absoluteInput[action] = value;
    }
  }

  // InputType: gamepadAxisStandard
  receiveAsGamepadAxisStandard({ action, value, control }: FullActionData) {
    if (control.disallowSign !== 0) {
      if (control.disallowSign === 1 && value > 0) {
        return;
      }
      else if (control.disallowSign === -1 && value < 0) {
        return;
      }
    }

    // console.log('[analog stick]', { action, actionType: ActionType[control.actionType], value, control });
    let result;
    if (Math.abs(value) < ANALOG_STICK_THRESHOLD) {
      result = 0;

      // Check the previous action to see if that, too, was effectively 0.
      if (this._analogFlutterCheck[action] === 0) {
        // console.log(`[receiveAsGamepadAxisStandard] Preventing bad ${action} reset.`);
        return;
      }
    }
    else if (result !== 0) {
      // @ts-ignore - See comment in receiveAsKeyboardButton.
      const multiplier = control.multiplier.gamepadAxisStandard as number;
      const effectiveThreshold = multiplier * ANALOG_STICK_THRESHOLD;
      result = value * multiplier;
      // This allows the user to ease into the turn without suddenly jumping to
      // for example 50%. It's basically makes the threshold an offset.
      // TODO: Test me with H.O.T.A.S. throttle, gamepad throttle, and gamepad
      //  bumper-as-button. I think I probably just forgot
      //  ANALOG_STICK_THRESHOLD here, but it's a long time ago and I could be
      //  wrong.
      result > 0
        ? result -= effectiveThreshold //+ -ANALOG_STICK_THRESHOLD
        : result += effectiveThreshold; //+ -ANALOG_STICK_THRESHOLD;
    }

    let stateTarget;
    if (control.isBidirectional) {
      stateTarget = this.cumulativeInput;
    }
    else {
      stateTarget = this.absoluteInput;
    }

    if (ANALOG_STICK_EASING) {
      // @ts-ignore - See comment in receiveAsKeyboardButton.
      const maxRange = control.multiplier.gamepadAxisStandard - ANALOG_STICK_THRESHOLD;
      stateTarget[action] = easeIntoExp(result, maxRange);
    }
    else {
      stateTarget[action] = result;
    }

    // Store the value so that we can check for invalid resets on next use.
    this._analogFlutterCheck[action] = result;
  }

  // InputType: mouseButton
  receiveAsMouseButton(actionData: FullActionData) {
    // This works pretty much identically to keyboard; send it there instead.
    this.receiveAsKeyboardButton(actionData);
  }

  // InputType: mouseAxisStandard
  receiveAsMouseAxisStandard({ action, value, analogData, control }: FullActionData) {
    if (control.disallowSign !== 0) {
      if (control.disallowSign === 1 && value > 0) {
        return;
      }
      else if (control.disallowSign === -1 && value < 0) {
        return;
      }
    }

    // console.log('[mouse movement | standard]', { action, actionType: ActionType[control.actionType], value, analogData, control });
    // console.log(`--> analogData[${action}]: delta=${analogData.delta}; grav=${analogData.gravDelta}`);
    // @ts-ignore - See comment in receiveAsKeyboardButton.
    this.absoluteInput[action] += analogData.delta * control.multiplier.mouseAxisStandard;
  }

  // InputType: mouseAxisThreshold
  receiveAsMouseAxisThreshold({ action, value, analogData, control }: FullActionData) {
    // @ts-ignore - See comment in receiveAsKeyboardButton.
    const result = this.absoluteInput[action] += analogData.delta * control.multiplier.mouseAxisStandard * 0.01;
    this.absoluteInput[action] = clamp(result, -1, 1);
  }

  // InputType: mouseAxisGravity
  receiveAsMouseAxisGravity({
    action,
    value,
    analogData,
    control,
  }: FullActionData) {
    // @ts-ignore - See comment in receiveAsKeyboardButton.
    const result = this.absoluteInput[action] + (analogData.delta * control.multiplier.mouseAxisStandard * 0.01);
    const clamped = clamp(result, -1, 1);
    this.absoluteInput[action] = clamped;

    // console.log('grav start');
    this._gravAction[action] = 1;
  }

  receiveAsGamepadSlider({ action, value, control }: FullActionData) {
    if (control.disallowSign !== 0) {
      if (control.disallowSign === 1 && value > 0) {
        return;
      }
      else if (control.disallowSign === -1 && value < 0) {
        return;
      }
    }

    // console.log('[analog slider]', { action, actionType: ActionType[control.actionType], value, control });

    if (control.repurposeThreshold) {
      const info = control.repurposeThreshold;
      if (Math.sign(value) === Math.sign(info.threshold)) {
        if (Math.abs(value) >= Math.abs(info.threshold)) {
          this.handlePulse({ action: info.remapToPulse, value: 1 });
          this.absoluteInput[action] = info.ghostValue;
          this.cumulativeInput[action] = 0;
          return;
        }
        else {
          this.handlePulse({ action: info.remapToPulse, value: 0 });
        }
      }
    }

    // The slider should overwrite active values as the slider gives an
    // absolute value. This makes mode implementations easier. Note that this
    // does not disallow the user from using a stick and a slider for the same
    // control at the same time.
    this.cumulativeInput[action] = 0;

    // If the value is very close to 0, then we're at that annoying point where
    // the player wants a zero but can't quite get it. Just set to 0.
    if (Math.abs(value) < SLIDER_EPSILON) {
      this.absoluteInput[action] = 0;
    }
    else {
      this.absoluteInput[action] = value;
    }
  }

  receiveAsScrollWheel({ action, value, control }: FullActionData) {
    if (control.actionType === ActionType.continuous) {
      return console.error(
        '[ModeController] receiveAsScrollWheel controls should be of type ' +
        'ActionType.pulse or ActionType.hybrid.',
      );
    }

    this.handlePulse({ action, value });
  }

  // Pulse once if the button is down. We don't pulse on release. Doesn't pulse
  // if receiving two subsequent non-zero values without first getting a zero.
  //
  // Dev note: this does not support mouse movement.
  handlePulse({ action, value }: BasicActionData) {
    // Dev note: if not read carefully, the code below may appear as though it
    // triggers pulses twice (one on press, one on release). This is not the
    // case - on release, pulseAction.setSilent(0) resets pulse state without
    // informing mode controller plugins. This is intentional and should not be
    // changed.

    const pulseAction = this.pulse[action];
    if (!pulseAction) {
      return console.error(
        `[ModeController] Pulsed control '${action}' requires a pulse ` +
        `mapping to be defined (missing in ${this.name}).`,
      );
    }

    if (value > ANALOG_BUTTON_THRESHOLD) {
      if (pulseAction.cachedValue === 0) {
        pulseAction.setValue(1);
      }
    }
    else if (value > 0) {
      // Prevent glitchy gamepads from cock blocking keyboard presses for the
      // same control.
      // console.log(`-> ignoring bad value ${value} < ${ANALOG_BUTTON_THRESHOLD}`);
      return;
    }
    else if (pulseAction.cachedValue !== 0) {
      // console.log('[input-agnostic pulse] -- RESET --', { action, value });
      pulseAction.setSilent(0);
    }
  }

  onActivateController() {
    // The ModeController base class does not use activation itself.
  }

  onDeactivateController() {
    // The ModeController base class does not use activation itself.
  }

  step() {
    const { delta } = animationData;

    const gravValues = Object.entries(this._gravAction);
    if (gravValues.length) {
      for (let i = 0; i < gravValues.length; i++) {
        const [ action, value ] = gravValues[i];
        const newValue = chaseValue(delta * 10, value, 0);
        if (newValue) {
          this._gravAction[action] = newValue;
        }
        else {
          this.absoluteInput[action] = 0;
          delete this._gravAction[action];
        }
      }
    }
  }
}
