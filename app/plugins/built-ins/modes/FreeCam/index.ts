import CosmosisPlugin from '../../../types/CosmosisPlugin';
import { gameRuntime } from '../../../gameRuntime';
import { InputManager } from '../../InputManager';
import ControlSchema from '../../InputManager/types/ControlSchema';
import { freeCamControls as allControls } from './controls';

class FreeCam {
  public controlScheme: ControlSchema;

  constructor() {
    const inputManager: InputManager =  gameRuntime.tracked.inputManager.cachedValue;
    inputManager.registerController('freeCam');
    this.controlScheme = new ControlSchema({
      name: 'freeCam',
      allControls,
      metadata: {
        description: 'Free flying camera (press F8 to activate).',
      }
    });
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCam', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
