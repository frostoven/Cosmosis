import _ from 'lodash';
import ChangeTracker from 'change-tracker/src';
import userProfile from '../../../../userProfile';
import { gameRuntime } from '../../../gameRuntime';
import { InputManager } from '../index';
import { ModeId } from './ModeId';
import { ActionType } from './ActionType';
import { ControlSchema } from '../interfaces/ControlSchema';
import { arrayContainsArray } from '../../../../local/utils';
import { InputType } from './InputTypes';
import { easeIntoExp, signRelativeMax } from '../../../../local/mathUtils';

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

// TODO: move me into user profile.
const SLIDER_EPSILON = 0.01;

export default class ModeController {
  public name: string;
  public modeId: ModeId;
  public controlSchema: ControlSchema;
  public controlsByKey: {};
  private readonly _actionReceivers: Array<Function>;

  // Passive state. This only changes when something external changes. Stores
  // last known pressed values.
  public state: { [action: string]: number };
  // This actively updates this.state. Useful for situations where action is
  // implied (for example a gamepad stick sitting at -1.0 without changing).
  // TODO: rename to additive state instead? Because that's technically what
  //  it's for - its state is added to this.state each frame.
  public activeState: { [action: string]: number };
  // Designed for instant actions and toggleables. Contains change trackers.
  public pulse: { [actionName: string]: ChangeTracker };

  // This fixes an issues where, if an analog stick and another device such as
  // the keyboard are mapped to the same action, eg. walk forward, the keyboard
  // action will spontaneously stop working (eg. the player will stop walking
  // even though the walk button is still pressed). This happens because the
  // jitter of a bad stick effectively simulates the equivalent keyboard button
  // being released. This object keeps track of previous analog values. If, by
  // threshold, it was effectively zero the last time it was activated, then
  // the input is ignored instead of being reset in state.
  private _analogFlutterCheck: { [actionName: string]: number };

  constructor(name: string, modeId: ModeId, controlSchema: ControlSchema) {
    this.name = name;
    this.modeId = modeId;
    this.controlSchema = {};
    this.controlsByKey = {};

    this.state = {};
    this.activeState = {};
    this.pulse = {};
    this._analogFlutterCheck = {};

    // Note: the indexes of this array MUST match the indexes in ./InputTypes
    // or things will break.
    this._actionReceivers = [
      this.receiveAndIgnore.bind(this),
      this.receiveAsKbButton.bind(this),
      this.receiveAsAnalogButton.bind(this),
      this.receiveAsAnalogStick.bind(this),
      this.receiveAsMouseButton.bind(this),
      this.receiveAsMouse.bind(this),
      this.receiveAsMouseAxisGravity.bind(this),
      this.receiveAsMouseAxisThreshold.bind(this),
      this.receiveAsAnalogSlider.bind(this),
    ];

    // Control setup.
    this.extendControlSchema(controlSchema);

    const inputManager: InputManager = gameRuntime.tracked.inputManager.cachedValue;
    inputManager.registerController(this);
  }

  // This allows both core code and modders to add their own control bindings.
  extendControlSchema(controlSchema: ControlSchema) {
    const savedControls = userProfile.getCurrentConfig({ identifier: 'controls' }).controls;
    const actionInputMap = {
      /* Example: */
      /* forward: { action: 'KeyW', inputType: InputTypes.keyboardButton } */
    };
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
          // console.log('85========>', `controlSchema[${actionName}].current = { ...`, controlSchema[actionName].default, '}')

        catch (error) {
          console.error(`[ModeController] Failed to set key for action '${actionName}'`, error);
        }
      // }


      /* Example: */
      /* actionInputMap = { forward: { action: 'KeyW', inputType: InputTypes.keyboardButton } };*/
      // controlSchema[actionName].actionInputMap = {
      //   actionName
      // };

      if (!controlSchema[actionName].sign) {
        controlSchema[actionName].sign = 1;
      }
    });

    const allowedConflicts = {};

    _.each(controlSchema, (control: ControlSchema['key'], actionName: string) => {
      if (this.controlSchema[actionName]) {
        return console.error(
          `[ModeController] Ignoring attempt to set register control action ` +
          `'${actionName}' in mode ${this.name} - ${this.name} already has `
          + `that action defined for something else.`
        );
      }

      this.controlSchema[actionName] = { ...control };
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
        // console.log('149------->', key);
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

      if (control.actionType === ActionType.pulse) {
        this.pulse[actionName] = new ChangeTracker();
        this.pulse[actionName].setSilent(0);
      }
      else {
        this.state[actionName] = 0;
        this.activeState[actionName] = 0;
      }
    });
  }

  receiveAction(
    {
      action,
      key,
      value,
      analogData,
    }: { action: string, key: string | undefined, value: number, analogData: object | undefined },
  ) {
    const control = this.controlSchema[action];
    const actionType = control.actionType;
    const sign = control.sign;

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
    }
    else {
      this._actionReceivers[inputType]({ action, value, analogData, control });
    }
  }

  // --------------------------------------------------------------------------

  // InputType: none
  receiveAndIgnore({ action }) {
    console.log('Received but ignoring', action);
  }

  // Receives a non-pulsed keyboard button.
  // InputType: keyboardButton
  receiveAsKbButton({ action, value, control }) {
    // console.log('[keyboard button]', { action, actionType: ActionType[control.actionType], value, control });
    if (control.analogRemap) {
      // TODO: value multipliers should probably go into the control definition
      //  as we probably don't want things being arbitrarily multiplied for no
      //  reason. Maybe call it 'remapMultiplier' to indicate it's only used
      //  for analog remaps.
      this.activeState[control.analogRemap] = value * control.multiplier.keyboardButton * control.sign;
    }
    else {
      // Under normal circumstances this value is always either 0 or 1.
      this.state[action] = value;
    }
  }

  // InputType: analogButton
  receiveAsAnalogButton({ action, value, control }) {
    // console.log('[analog button]', { action, actionType: ActionType[control.actionType], value, control });
    // Under normal circumstances this value is always in range of 0-1.
    if (value < ANALOG_BUTTON_THRESHOLD) {
      value = 0;
    }

    if (control.analogRemap) {
      this.activeState[control.analogRemap] = value * control.multiplier.analogButton * control.sign;
    }
    else {
      // This has a range of 0 to 1.
      this.state[action] = value;
    }
  }

  // InputType: analogStickAxis
  receiveAsAnalogStick({ action, value, control }) {
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
        // console.log(`[receiveAsAnalogStick] Preventing bad ${action} reset.`);
        return;
      }
    }
    else if (result !== 0) {
      const multiplier = control.multiplier.analogStickAxis;
      const effectiveThreshold = multiplier * ANALOG_STICK_THRESHOLD;
      result = value * multiplier;
      // This allows the user to ease into the turn without suddenly jumping to
      // for example 50%. It's basically makes the threshold an offset.
      result > 0
        ? result -= effectiveThreshold + -ANALOG_STICK_THRESHOLD
        : result += effectiveThreshold + -ANALOG_STICK_THRESHOLD;
    }

    let stateTarget;
    if (control.isBidirectional) {
      stateTarget = this.activeState;
    }
    else {
      stateTarget = this.state;
    }

    if (ANALOG_STICK_EASING) {
      const maxRange = control.multiplier.analogStickAxis - ANALOG_STICK_THRESHOLD;
      stateTarget[action] = easeIntoExp(result, maxRange);
    }
    else {
      stateTarget[action] = result;
    }

    // Store the value so that we can check for invalid resets on next use.
    this._analogFlutterCheck[action] = result;
  }

  // InputType: mouseButton
  receiveAsMouseButton({ action, value, control }) {
    console.log('[mouse button]', { action, actionType: ActionType[control.actionType], value, control });
  }

  // InputType: mouseAxisInfinite
  receiveAsMouse({ action, value, analogData, control }) {
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
    this.state[action] += analogData.delta * control.multiplier.mouseAxisInfinite;
  }

  // InputType: mouseAxisGravity
  receiveAsMouseAxisGravity({ action, value, analogData, control }) {
    console.log('[mouse movement | gravity]', { action, actionType: ActionType[control.actionType], value, analogData, control });
    this.state[action] += this.state[action] += analogData.delta;
  }

  // InputType: mouseAxisThreshold
  receiveAsMouseAxisThreshold({ action, value, analogData, control }) {
    console.log('[mouse movement | threshold]', { action, actionType: ActionType[control.actionType], value, analogData, control });
    const result = this.state[action] += value * control.multiplier.mouseAxisInfinite;
    if (Math.abs(result) > 1) {
      this.state[action] = signRelativeMax(result, 1);
    }
    console.log(`[mouse{${this.name}}|${action}]`, this.state[action]);
  }

  receiveAsAnalogSlider({ action, value, control }) {
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
          this.state[action] = info.ghostValue;
          this.activeState[action] = 0;
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
    this.activeState[action] = 0;

    // If the value is very close to 0, then we're at that annoying point where
    // the player wants a zero but can't quite get it. Just set to 0.
    if (Math.abs(value) < SLIDER_EPSILON) {
      this.state[action] = 0;
    }
    else {
      this.state[action] = value;
    }
  }

  // Pulse once if the button is down. We don't pulse on release. Doesn't pulse
  // if receiving two subsequent non-zero values without first getting a zero.
  //
  // Dev note: this does not support mouse movement.
  handlePulse({ action, value }) {
    if (value > ANALOG_BUTTON_THRESHOLD) {
      if (this.pulse[action].cachedValue === 0) {
        console.log('[input-agnostic pulse]', { action, value });
        this.pulse[action].setValue(1);
      }
    }
    else if (value > 0) {
      // Prevent glitchy gamepads from cock blocking keyboard presses for the
      // same control.
      // console.log(`-> ignoring bad value ${value} < ${ANALOG_BUTTON_THRESHOLD}`);
      return;
    }
    else if (this.pulse[action].cachedValue !== 0) {
      // console.log('[input-agnostic pulse] -- RESET --', { action, value });
      this.pulse[action].setSilent(0);
    }
  }

  onActivateController() {
    // The ModeController base class does not use activation itself.
  }

  step(delta, bigDelta) {
    // The ModeController base class does not use stepping itself.
  }
}
