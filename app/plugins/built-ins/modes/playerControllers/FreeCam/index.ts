import { Camera } from 'three';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { freeCamControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import {
  applyPolarRotation,
  clamp,
  zAxis,
} from '../../../../../local/mathUtils';
import Speed from '../../../../../local/Speed';
import Core from '../../../Core';
import Player from '../../../Player';

const animationData = Core.animationData;

// Directly affects flight movement speed.
const SPEED_FACTOR = 0.25;

class FreeCam extends ModeController {
  // @ts-ignore
  private _cachedCamera: Camera;
  private _cachedInputManager: InputManager;
  public maxMoveSpeed: Speed;

  constructor() {
    const uiInfo = { friendly: 'Free-Flight Camera', priority: 70 };
    super('freeCam', ModeId.flightControl, freeCamControls, uiInfo);

    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;
    this.maxMoveSpeed = new Speed(1);

    this._setupWatchers();
    this._setupPulseListeners();
  }

  _setupWatchers() {
    gameRuntime.tracked.player.getEveryChange((player: Player) => {
      this._cachedCamera = player.camera;
    });
    gameRuntime.tracked.inputManager.getEveryChange((inputManager: InputManager) => {
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
      this._cachedInputManager.activateController(ModeId.flightControl, 'helmControl');
    });
  }

  onActivateController() {
    const state = this.absoluteInput;
    state.lookLeftRight = state.lookUpDown = 0;
  }

  step() {
    super.step();
    if (!this._cachedCamera) {
      return;
    }

    const { delta, bigDelta } = animationData;

    // We always delta cumulativeInput, but never delta absoluteInput.
    this.absoluteInput.lookLeftRight += this.cumulativeInput.lookLeftRight * bigDelta;
    this.absoluteInput.lookUpDown += this.cumulativeInput.lookUpDown * bigDelta;
    this.absoluteInput.rollAnalog += this.cumulativeInput.rollAnalog * bigDelta;
    //
    const moveLeftRight = clamp(
      this.absoluteInput.moveLeftRight + this.cumulativeInput.moveLeftRight,
      -1, 1,
    );
    const moveUpDown = clamp(
      this.absoluteInput.moveUpDown + this.cumulativeInput.moveUpDown,
      -1, 1,
    );
    const moveForwardBackward = clamp(
      this.absoluteInput.moveForwardBackward + this.cumulativeInput.moveForwardBackward,
      -1, 1,
    );

    let speedFactor = SPEED_FACTOR;
    this.absoluteInput.halfSpeed && (speedFactor = 0.5);
    this.absoluteInput.doubleSpeed && (speedFactor = 2);

    if (this.absoluteInput.speedUp) {
      this.maxMoveSpeed.rampUpSmall(delta * Math.pow(speedFactor, 10));
    }
    if (this.absoluteInput.slowDown) {
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
    this._cachedCamera.quaternion.setFromAxisAngle(zAxis, -this.absoluteInput.rollAnalog);

    // Note: don't use delta here. We don't want mouse speed to be dependent on
    // framerate.
    applyPolarRotation(
      (this.absoluteInput.lookLeftRight),
      (this.absoluteInput.lookUpDown),
      this._cachedCamera.quaternion,
    );
  }
}

const freeCamPlugin = new CosmosisPlugin('freeCam', FreeCam);

export {
  FreeCam,
  freeCamPlugin,
};
