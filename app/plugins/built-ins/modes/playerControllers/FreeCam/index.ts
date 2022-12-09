import _ from 'lodash';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import { InputManager } from '../../../InputManager';
import { gameRuntime } from '../../../../gameRuntime';
import { ModeId } from '../../../InputManager/types/ModeId';
import { freeCamControls } from './controls';
import userProfile from '../../../../../userProfile';

class FreeCam {
  private name: string;

  constructor() {
    const name = this.name = 'freeCam';
    const savedControls = userProfile.getCurrentConfig({ identifier: 'controls' }).controls;
    _.each(freeCamControls, (control, actionName) => {
      if (savedControls[actionName]) {
        // Override default controls with user-chosen ones.
        freeCamControls[actionName].current = savedControls[actionName];
      }
      else {
        // User profile does not have this control stored. Use default.
        freeCamControls[actionName].current = freeCamControls[actionName].default;
      }
    });

    const inputManager: InputManager = gameRuntime.tracked.inputManager.cachedValue;
    inputManager.registerController(
      name,
      ModeId.playerControl,
      freeCamControls,
      this.receiveAction.bind(this),
    );
  }

  receiveAction() {
    //
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCamPlugin', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
