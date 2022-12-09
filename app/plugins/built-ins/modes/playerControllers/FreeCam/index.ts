import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { freeCamControls } from './controls';

class FreeCam extends ModeController {
  constructor() {
    super('freeCame', freeCamControls);

    this.pulse.interact.getEveryChange(() => {
      console.log('grabbing interactable.');
    });
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCamPlugin', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
