import { Camera } from 'three';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { freeCamControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import { applyPolarRotation } from '../../../../../local/mathUtils';

class FreeCam extends ModeController {
  // @ts-ignore
  private _cachedCamera: Camera;
  private _cachedInputManager: InputManager;

  constructor() {
    super('freeCam', ModeId.playerControl, freeCamControls);
    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;

    this._setupWatchers();
    this._setupPulseListeners();
  }

  _setupWatchers() {
    gameRuntime.tracked.player.getEveryChange((player) => {
      this._cachedCamera = player.camera;
    });
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

  onActivateController() {
    const state = this.state;
    state.lookLeftRight = state.lookUpDown = 0;
  }

  // noinspection JSSuspiciousNameCombination
  step(delta) {
    if (!this._cachedCamera) {
      return;
    }

    this.state.lookLeftRight += this.activeState.lookLeftRight;
    this.state.lookUpDown += this.activeState.lookUpDown;

    // console.log(`lookLeftRight=${this.state.lookLeftRight}; lookUpDown=${this.activeState.lookUpDown}`);

    // Left and right movement:
    this._cachedCamera.translateX((this.state.moveRight - this.state.moveLeft) * delta);
    // Up and down movement:
    this._cachedCamera.translateY((this.state.moveUp - this.state.moveDown) * delta);
    // Backwards and forwards movement:
    this._cachedCamera.translateZ((this.state.moveBackward - this.state.moveForward) * delta);

    // Note: don't use delta here. We don't want mouse speed to be dependent on
    // framerate.
    applyPolarRotation(
      (this.state.lookLeftRight),
      (this.state.lookUpDown),
      this._cachedCamera.quaternion,
    );

    // Camera rolling.
    this._cachedCamera.rotateZ(this.state.rollLeft + this.state.rollRight);
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCam', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
