import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { freeCamControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';

class FreeCam extends ModeController {
  private _cachedInputManager: InputManager;

  constructor() {
    super('freeCam', ModeId.playerControl, freeCamControls);
    this._setupWatchers();

    // This controller activates itself by default:
    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;
    this._cachedInputManager.activateController(ModeId.playerControl, this.name);

    this._setupPulseListeners();

  }

  _setupWatchers() {
    gameRuntime.tracked.inputManager.getEveryChange((inputManager) => {
      this._cachedInputManager = inputManager;
    });
  }

  _setupPulseListeners() {
    this.pulse.interact.getEveryChange(() => {
      console.log('grabbing interactable.');
    });

    this.pulse._devChangeCamMode.getEveryChange(() => {
      this._cachedInputManager.activateController(ModeId.playerControl, 'shipPilot');
    });
  }

  step(delta) {
    //
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCamPlugin', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
