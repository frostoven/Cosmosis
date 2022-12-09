import _ from 'lodash';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import { InputManager } from '../../../InputManager';
import { gameRuntime } from '../../../../gameRuntime';
import { ModeId } from '../../../InputManager/types/ModeId';
import { freeCamControls } from './controls';
import userProfile from '../../../../../userProfile';
import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import ChangeTracker from 'change-tracker/src';

class FreeCam {
  public name: string;
  public controls: ControlSchema;
  public controlsByKey: {};
  public state: {};
  public pulse: {};

  constructor() {
    const name = this.name = 'freeCam';
    const controls = this.controls = freeCamControls;
    this.controlsByKey = {};

    const savedControls = userProfile.getCurrentConfig({ identifier: 'controls' }).controls;
    _.each(controls, (control, actionName) => {
      if (savedControls[actionName]) {
        // Override default controls with user-chosen ones.
        controls[actionName].current = savedControls[actionName];
      }
      else {
        // User profile does not have this control stored. Use default.
        controls[actionName].current = controls[actionName].default;
      }
    });

    // Stores analog values, usually "key was pressed" kinda-stuff.
    this.state = {};
    // Designed for instant actions and toggleables. Contains change trackers.
    this.pulse = {};

    // Set up controlsByKey, state, and pulse.
    _.each(controls, (control: ControlSchema['key'], actionName: string) => {
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
      ModeId.playerControl,
      this.controlsByKey,
      this.receiveAction.bind(this),
    );

    // This specific controller activates itself by default:
    inputManager.activateController(ModeId.playerControl, name);
  }

  receiveAction({ action, isDown, analogData }) {
    const control = this.controls[action];
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

  handlePulse({ action, isDown }) {
    // Pulse once if the button is down. We don't pulse on release.
    if (isDown) {
      this.pulse[action].setValue(1);
    }
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCamPlugin', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
