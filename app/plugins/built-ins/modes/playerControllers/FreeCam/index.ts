import { Camera, Euler } from 'three';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { freeCamControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import { applyPolarRotation, zAxis } from '../../../../../local/mathUtils';

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

    // Note: this method of adding delta is intentional - we don't want passive
    // values delta'd, because passive values come from absolute numbers (such
    // as actual mouse position). We do however want active values delta'd,
    // because they represent a relative change on a per-frame basis (ex. a
    // gamepad stick at the 50% mark means add 0.5 units per x unit time).
    this.state.lookLeftRight += this.activeState.lookLeftRight * delta;
    this.state.lookUpDown += this.activeState.lookUpDown * delta;
    this.state.rollLeftRight += this.activeState.rollLeftRight * delta * 0.001;

    // Left and right movement:
    this._cachedCamera.translateX((this.state.moveRight - this.state.moveLeft) * delta);
    // Up and down movement:
    this._cachedCamera.translateY((this.state.moveUp - this.state.moveDown) * delta);
    // Backwards and forwards movement:
    this._cachedCamera.translateZ((this.state.moveBackward - this.state.moveForward) * delta);

    // Apply camera roll.
    this._cachedCamera.quaternion.setFromAxisAngle(zAxis, -this.state.rollLeftRight);

    // Note: don't use delta here. We don't want mouse speed to be dependent on
    // framerate.
    applyPolarRotation(
      (this.state.lookLeftRight),
      (this.state.lookUpDown),
      this._cachedCamera.quaternion,
    );
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCam', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
}
