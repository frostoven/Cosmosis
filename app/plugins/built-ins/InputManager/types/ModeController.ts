import _ from 'lodash';
import ChangeTracker from 'change-tracker/src';
import userProfile from '../../../../userProfile';
import { gameRuntime } from '../../../gameRuntime';
import { InputManager } from '../index';
import { ModeId } from './ModeId';
import { ActionType } from './ActionType';
import { ControlSchema } from '../interfaces/ControlSchema';

export default class ModeController {
  public name: string;
  public modeId: ModeId;
  public controlSchema: ControlSchema;
  public controlsByKey: {};
  public state: { [action: string]: number };
  public pulse: { [actionName: string]: ChangeTracker };
  private readonly continualAdders: { [action: string]: Function };

  constructor(name: string, modeId: ModeId, controlSchema: ControlSchema) {
    this.name = name;
    this.modeId = modeId;
    this.controlSchema = controlSchema;
    this.controlsByKey = {};

    const savedControls = userProfile.getCurrentConfig({ identifier: 'controls' }).controls;
    _.each(controlSchema, (control, actionName) => {
      if (savedControls[actionName]) {
        // Override default controls with user-chosen ones.
        controlSchema[actionName].current = savedControls[actionName];
      }
      else {
        // User profile does not have this control stored. Use default.
        controlSchema[actionName].current = controlSchema[actionName].default;
      }
    });

    // Stores analog values, usually "key was pressed" kinda-stuff.
    this.state = {};

    // Designed for instant actions and toggleables. Contains change trackers.
    this.pulse = {};

    this.continualAdders = {};

    // Set up controlsByKey, state, and pulse.
    _.each(controlSchema, (control: ControlSchema['key'], actionName: string) => {
      const keys = control.current;
      // The user can assign multiple keys to each action; store them all in
      // controlsByKey individually.
      _.each(keys, (key) => {
        this.controlsByKey[key] = actionName;
      });

      if (control.actionType === ActionType.pulse) {
        this.pulse[actionName] = new ChangeTracker();
      }
      else {
        this.state[actionName] = 0;
      }
    });

    const inputManager: InputManager = gameRuntime.tracked.inputManager.cachedValue;
    inputManager.registerController(
      name,
      modeId,
      this.controlsByKey,
      this.receiveAction.bind(this),
    );
  }

  receiveAction({ action, isDown, analogData }) {
    const control = this.controlSchema[action];
    const actionType = control.actionType;

    if (actionType === ActionType.analogLiteral) {
      this.handleReceiveLiteral({ action, isDown, analogData });
    }
    else if (actionType === ActionType.analogGravity) {
      this.handleReceiveGravity({ action, isDown, analogData });
    }
    else if (actionType === ActionType.pulse) {
      this.handlePulse({ action, isDown });
    }
    else if (actionType === ActionType.analogAdditive) {
      this.handleReceiveAdditive({ action, isDown, analogData });
    }
    // else if (actionType === ActionType.analogHybrid) {
    //   this.handleReceiveHybrid({ action, isDown, analogData });
    // }
  }

  handleReceiveLiteral({ action, isDown, analogData }) {
    if (analogData) {
      this.state[action] = analogData.delta;
    }
    else {
      this.state[action] = isDown === true ? 1 : 0;
    }
  }

  handleReceiveGravity({ action, isDown, analogData }) {
    if (analogData) {
      this.state[action] = analogData.gravDelta;
    }
    else {
      this.state[action] = isDown === true ? 1 : 0;
    }
  }

  handleReceiveAdditive({ action, isDown, analogData }) {
    if (analogData) {
      this.state[action] += analogData.delta;
    }
    else {
      this.state[action] = isDown === true ? 1 : 0;
    }
  }

  // handleReceiveHybrid({ action, isDown, analogData }) {
  //   if (analogData) {
  //     // let delta = Math.abs(analogData.delta);
  //     // const sign = analogData.gravDelta < 0 ? -1 : 0;
  //     this.state[action] += analogData.delta;
  //     // console.log(this.state['pitchDown'])
  //     (action === 'pitchUp' || action === 'pitchDown') && console.log({action});
  //   }
  //   else if (isDown) {
  //     this.continualAdders[action] = () => {
  //       this.state[action]++;
  //     };
  //     gameRuntime.tracked.core.cachedValue.onAnimate.getEveryChange(this.continualAdders[action]);
  //   }
  //   else {
  //     gameRuntime.tracked.core.cachedValue.onAnimate.removeGetEveryChangeListener(this.continualAdders[action]);
  //   }
  // }

  handlePulse({ action, isDown }) {
    // Pulse once if the button is down. We don't pulse on release.
    if (isDown) {
      this.pulse[action].setValue(1);
    }
  }
}
