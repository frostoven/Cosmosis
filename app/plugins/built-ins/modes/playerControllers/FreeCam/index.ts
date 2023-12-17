import { Camera, Euler } from 'three';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { freeCamControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import { applyPolarRotation, clamp, zAxis } from '../../../../../local/mathUtils';
import Speed from '../../../../../local/Speed';

const SPEED_FACTOR = 1;
// const SPEED_FACTOR = 1 * 0.0125;
// const SPEED_FACTOR = 1 * 0.005;

class FreeCam extends ModeController {
  // @ts-ignore
  private _cachedCamera: Camera;
  private _cachedInputManager: InputManager;
  public maxMoveSpeed: Speed;

  constructor() {
    const uiInfo = { friendly: 'Free-Flight Camera', priority: 70 };
    super('freeCam', ModeId.playerControl, freeCamControls, uiInfo);

    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;
    this.maxMoveSpeed = new Speed(1);

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

    this.pulse.speedUp.getEveryChange(() => {
      this.maxMoveSpeed.rampUpSmall(Math.pow(SPEED_FACTOR, 5));
    });

    this.pulse.slowDown.getEveryChange(() => {
      this.maxMoveSpeed.rampDownSmall(Math.pow(SPEED_FACTOR, 5));
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
  step(delta, bigDelta) {
    if (!this._cachedCamera) {
      return;
    }

    // Note: this method of adding delta is intentional - we don't want passive
    // values delta'd, because passive values come from absolute numbers (such
    // as actual mouse position). We do however want active values delta'd,
    // because they represent a relative change on a per-frame basis (ex. a
    // gamepad stick at the 50% mark means add 0.5 units per x unit time).
    this.state.lookLeftRight += this.activeState.lookLeftRight * bigDelta;
    this.state.lookUpDown += this.activeState.lookUpDown * bigDelta;
    this.state.rollAnalog += this.activeState.rollAnalog * bigDelta;
    //
    const moveLeftRight = clamp(this.state.moveLeftRight + this.activeState.moveLeftRight, -1, 1);
    const moveUpDown = clamp(this.state.moveUpDown + this.activeState.moveUpDown, -1, 1);
    const moveForwardBackward = clamp(this.state.moveForwardBackward + this.activeState.moveForwardBackward, -1, 1);

    let speedFactor = SPEED_FACTOR;
    this.state.halfSpeed && (speedFactor = 0.5);
    this.state.doubleSpeed && (speedFactor = 2);

    if (this.state.speedUp) {
      this.maxMoveSpeed.rampUpSmall(delta * Math.pow(speedFactor, 10));
    }
    if (this.state.slowDown) {
      this.maxMoveSpeed.rampDownSmall(delta * Math.pow(speedFactor, 10));
    }

    const speed = this.maxMoveSpeed.currentSpeed;

    // Left and right movement:
    this._cachedCamera.translateX((moveLeftRight * speed) * delta * speedFactor);
    // Up and down movement:
    this._cachedCamera.translateY((moveUpDown * speed) * delta * speedFactor);
    // Backwards and forwards movement:
    this._cachedCamera.translateZ((moveForwardBackward * speed) * delta * speedFactor);

    // Apply camera roll.
    this._cachedCamera.quaternion.setFromAxisAngle(zAxis, -this.state.rollAnalog);

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
