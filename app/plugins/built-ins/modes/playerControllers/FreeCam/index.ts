import { Camera } from 'three';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { freeCamControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import { applyPolarRotation } from '../../../../../local/mathUtils';

// TODO: move me into user profile.
const MOUSE_SPEED = 0.7;

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
    state.yawLeft = state.yawRight = state.pitchUp = state.pitchDown = 0;
  }

  // noinspection JSSuspiciousNameCombination
  step(delta) {
    if (!this._cachedCamera) {
      return;
    }

    // Left and right movement:
    this._cachedCamera.translateX((this.state.moveRight - this.state.moveLeft) * delta);
    // Up and down movement:
    this._cachedCamera.translateY((this.state.moveUp - this.state.moveDown) * delta);
    // Backwards and forwards movement:
    this._cachedCamera.translateZ((this.state.moveBackward - this.state.moveForward) * delta);

    // Note: don't use delta here. We don't want mouse speed to be dependent on
    // framerate.
    applyPolarRotation(
      (this.state.yawLeft + this.state.yawRight) * MOUSE_SPEED,
      (this.state.pitchUp + this.state.pitchDown) * MOUSE_SPEED,
      this._cachedCamera.quaternion,
    );

    // Camera rolling.
    this._cachedCamera.rotateZ(this.state.rollLeft + this.state.rollRight);
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCamPlugin', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
