// Note:
// shipPilot mode does not do anything to the spaceship, or to space. It
// tells Navigation (or Location?) that space is being warped, or that bubbles
// are being entered/exited. It's Nav's (or Location's) job to figure out what
// that means.

import { Camera } from 'three';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { shipPilotControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { CoreType } from '../../../Core';
import { InputManager } from '../../../InputManager';
import { applyPolarRotation } from '../../../../../local/mathUtils';

// TODO: move me into user profile.
const MOUSE_SPEED = 0.7;

// Maximum number x-look can be at.
const headXMax = 2200;
// Maximum number y-look can be at.
const headYMax = 1150;

class ShipPilot extends ModeController {
  private _cachedCore: CoreType;
  // @ts-ignore
  private _cachedCamera: Camera;
  private _cachedInputManager: InputManager;

  constructor() {
    super('shipPilot', ModeId.playerControl, shipPilotControls);
    this._cachedCore = gameRuntime.tracked.core.cachedValue;
    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;

    // This controller activates itself by default:
    this._cachedInputManager.activateController(ModeId.playerControl, this.name);

    // This controller activates itself by default:
    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;
    // this._cachedInputManager.activateController(ModeId.playerControl, this.name);

    gameRuntime.tracked.player.getOnce((player) => {
      this._cachedCamera = player.camera;
    });

    this._setupWatchers();
    this._setupPulseListeners();
  }

  _setupWatchers() {
    gameRuntime.tracked.player.getEveryChange((player) => {
      this._cachedCamera = player.camera;
    });
  }

  _setupPulseListeners() {
    this.pulse._devChangeCamMode.getEveryChange(() => {
      this._cachedInputManager.activateController(ModeId.playerControl, 'freeCam');
    });
  }

  onActivateController() {
    gameRuntime.tracked.levelScene.getOnce((levelScene) => {
      levelScene.resetCameraSeatPosition();
    });

    const state = this.state;
    state.yawLeft = state.yawRight = state.pitchUp = state.pitchDown = 0;
  }

  // Disallows a 360 degree neck, but also prevent the player's head from
  // getting 'glued' to the ceiling if they look up aggressively.
  constrainNeck(axis, max, outParent, child1Key, child2Key) {
    // This function basically looks like the following, but is used for any
    // axis:
    // if (x > headYMax) {
    //   const diff = x - headYMax;
    //   x = headYMax;
    //   this.state.yawLeft -= diff;
    //   this.state.yawRight -= diff;
    // }
    if (axis > 0) {
      if (axis > max) {
        let diff = axis - max;
        outParent[child1Key] += -diff;
        outParent[child2Key] += -diff;
      }
    }
    else {
      if (axis < -max) {
        let diff = axis + max;
        outParent[child1Key] += -diff;
        outParent[child2Key] += -diff;
      }
    }
  }

  stepFreeLook() {
    let x = this.state.yawLeft + this.state.yawRight;
    let y = this.state.pitchUp + this.state.pitchDown;

    this.constrainNeck(x, headXMax, this.state, 'yawLeft', 'yawRight');
    this.constrainNeck(y, headYMax, this.state, 'pitchUp', 'pitchDown');

    // Note: don't use delta here. We don't want mouse speed to be dependent on
    // framerate.
    applyPolarRotation(
      x * MOUSE_SPEED,
      y * MOUSE_SPEED,
      this._cachedCamera.quaternion,
    );
  }

  // noinspection JSSuspiciousNameCombination
  step(delta) {
    if (!this._cachedCamera) {
      return;
    }

    this.stepFreeLook();
  }
}

const shipPilotPlugin = new CosmosisPlugin('shipPilotPlugin', ShipPilot);

export {
  ShipPilot,
  shipPilotPlugin,
}
