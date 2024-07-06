// Note:
// helmControl mode does not do anything to the spaceship, or to space. It
// merely reports high level input state.

import * as THREE from 'three';
import Core from '../../../Core';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { buckledPassengerControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { InputManager } from '../../../InputManager';
import {
  applyPolarRotation,
  chaseValue,
} from '../../../../../local/mathUtils';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import Player from '../../../Player';

// TODO: move me into user profile.
const MOUSE_SPEED = 0.7;

const abs = Math.abs;
const pi = Math.PI;

const maxHeadXAngle = pi;
const maxHeadYAngle = pi * 0.4;

const animationData = Core.animationData;

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  player: Player,
  inputManager: InputManager,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: THREE.Camera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------

/**
 * Used to look around you while in a chair.
 */
class BuckledPassenger extends ModeController {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  // The pointer lock API give us units in pixels. The delta'd result is stored
  // here. Due to how we restrict movement, only the Y axis is needed.
  private _headCurrentYPixels = 0;

  //  Our calculated current head polar angle.
  private _currentHeadXAngle = 0;
  private _currentHeadYAngle = 0;

  constructor() {
    const uiInfo = { friendly: 'Buckled Controls', priority: 80 };
    super('buckledPassenger', ModeId.buckledPassenger, buckledPassengerControls, uiInfo);
  }

  // ----------------------------------------------------------------------- //

  onActivateController() {
    this.resetLookState();
  }

  // Sets stick and pedal input to 0.
  resetPrincipleAxesInput() {
    const state = this.absoluteInput;
    state.yawLeft = state.yawRight = state.pitchUp = state.pitchDown =
      state.rollLeft = state.rollRight = 0;
  }

  // Sets neck inputs to 0.
  resetNeckAxesInput() {
    const state = this.absoluteInput;
    state.lookUp = state.lookDown = state.lookLeft = state.lookRight = 0;
  }

  // Sets all look and aim to 0.
  resetLookState() {
    this.resetNeckAxesInput();
    // TODO: consider making this next line a user-changeable option, because
    //  whether or not this is useful depends on controller setup.
    this.resetPrincipleAxesInput();
    this.setNeckPosition(0, 0);
    this.absoluteInput.lookLeftRight = 0;
    this.cumulativeInput.lookLeftRight = 0;
    this.absoluteInput.lookUpDown = 0;
    this.cumulativeInput.lookUpDown = 0;
  }

  // Sets the neck rotational position. This tries to work the same way a human
  // neck would, excluding tilting.
  setNeckPosition(x: number, y: number) {
    // Note: don't use delta here. We don't want mouse speed to be dependent on
    // framerate.
    applyPolarRotation(
      x * MOUSE_SPEED,
      y * MOUSE_SPEED,
      this._pluginCache.camera.quaternion,
      0,
      Math.PI,
      (py: number, px: number) => {
        this._currentHeadXAngle = px;
        this._currentHeadYAngle = py;
        return [ py, px ];
      },
    );
  }

  stepFreeLook(delta: number, bigDelta: number) {
    const xAbsInput = this.absoluteInput.lookLeftRight;
    const yAbsInput = this.absoluteInput.lookUpDown;
    const xCmInput = this.cumulativeInput.lookLeftRight;
    const yCmInput = this.cumulativeInput.lookUpDown;

    let newX = xAbsInput + xCmInput * bigDelta;
    let newY = yAbsInput + yCmInput * bigDelta;

    if (abs(this._currentHeadXAngle) > maxHeadXAngle) {
      // Head moved too far left or right. Restrict movement, but don't block
      // it; instead, we interpolate resistance.
      this.absoluteInput.lookLeftRight =
        chaseValue((abs((xAbsInput * 0.0005) ** 16) * delta), xAbsInput, 0);
      this.cumulativeInput.lookLeftRight =
        chaseValue((abs((xCmInput * 0.0005) ** 16) * delta), xCmInput, 0);
    }
    else {
      this.absoluteInput.lookLeftRight = newX;
    }

    if (abs(this._currentHeadYAngle) > maxHeadYAngle && abs(newY) > abs(this._headCurrentYPixels)) {
      // Unlike with left/right, we do hard-block up/down look instead of using
      // soft interpolation.
      this.absoluteInput.lookUpDown = newY = this._headCurrentYPixels;
    }
    else {
      this.absoluteInput.lookUpDown = newY;
    }

    this._headCurrentYPixels = newY;
    this.setNeckPosition(newX, newY);
  }

  step() {
    super.step();
    const { delta, bigDelta } = animationData;
    this.stepFreeLook(delta, bigDelta);
  }
}

const buckledPassengerPlugin = new CosmosisPlugin('buckledPassenger', BuckledPassenger);

export {
  BuckledPassenger,
  buckledPassengerPlugin,
};
