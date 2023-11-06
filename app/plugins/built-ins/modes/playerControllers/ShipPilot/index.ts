// Note:
// shipPilot mode does not do anything to the spaceship, or to space. It
// tells Navigation (or Location?) that space is being warped, or that bubbles
// are being entered/exited. It's Nav's (or Location's) job to figure out what
// that means.

import { Camera } from 'three';
import Core from '../../../Core';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { shipPilotControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import { applyPolarRotation, chaseValue, clamp } from '../../../../../local/mathUtils';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import Player from '../../../Player';

// TODO: move me into user profile.
const MOUSE_SPEED = 0.7;

// Maximum number x-look can be at.
const headXMax = 2200;
// Maximum number y-look can be at.
const headYMax = 1150;

type PluginCompletion = PluginCacheTracker & {
  player: Player, camera: Camera, inputManager: InputManager,
};

class ShipPilot extends ModeController {
  private _prettyPosition: number;
  private _throttlePosition: number;
  private _pluginCache: PluginCacheTracker | PluginCompletion;

  constructor() {
    super('shipPilot', ModeId.playerControl, shipPilotControls);
    InputManager.allControlSchemes.shipPilotControls = {
      key: 'shipPilotControls',
      schema: shipPilotControls,
      friendly: 'Ship Pilot Controls',
      priority: 80,
    };

    this._pluginCache = new PluginCacheTracker(
      [ 'player', 'core', 'inputManager' ],
      { player: { camera: 'camera' } },
    );

    // This controller activates itself by default:
    this._pluginCache.inputManager.activateController(ModeId.playerControl, this.name);

    // This controller activates itself by default:
    this._pluginCache.inputManager = gameRuntime.tracked.inputManager.cachedValue;
    // this._pluginCache.inputManager.activateController(ModeId.playerControl, this.name);

    this._prettyPosition = 0;
    this._throttlePosition = 0;

    this._setupPulseListeners();
  }

  _setupPulseListeners() {
    this.pulse.mouseHeadLook.getEveryChange(() => {
      this.state.mouseHeadLook = Number(!this.state.mouseHeadLook);
      this.resetLookState();
    });

    this.pulse._devChangeCamMode.getEveryChange(() => {
      this._pluginCache.inputManager.activateController(ModeId.playerControl, 'freeCam');
    });
  }

  // --- Getters and setters ----------------------------------------------- //

  get prettyThrottle() {
    return this._prettyPosition;
  }

  set prettyThrottle(value) {
    throw '[ShipPilot] actualThrottle is read-only and can only be set by ' +
    'internal means. Set throttlePosition instead.';
  }

  get throttlePosition() {
    return this._throttlePosition;
  }

  set throttlePosition(value) {
    this.state.thrustIncDec = clamp(value, -1, 1);
    this.activeState.thrustIncDec = 0;
  }

  // ----------------------------------------------------------------------- //

  onActivateController() {
    gameRuntime.tracked.levelScene.getOnce((levelScene) => {
      levelScene.resetCameraSeatPosition();
    });

    this.resetLookState();
  }

  // Sets stick and pedal input to 0.
  resetPrincipleAxesInput() {
    const state = this.state;
    state.yawLeft = state.yawRight = state.pitchUp = state.pitchDown =
      state.rollLeft = state.rollRight = 0;
  }

  // Sets neck inputs to 0.
  resetNeckAxesInput() {
    const state = this.state;
    state.lookUp = state.lookDown = state.lookLeft = state.lookRight = 0;
  }

  // Sets all look and aim to 0.
  resetLookState() {
    this.resetNeckAxesInput();
    // TODO: consider making this next line a user-changeable option, because
    //  whether or not this is useful depends on controller setup.
    this.resetPrincipleAxesInput();

    this.setNeckPosition(0, 0);
  }

  // Disallows a 360 degree neck, but also prevent the player's head from
  // getting 'glued' to the ceiling if they look up aggressively.
  constrainNeck(axis, max, outParent, child1Key, child2Key) {
    // This function basically looks like the following, but is used for any
    // axis:
    // if (x > headYMax) {
    //   const diff = x - headYMax;
    //   x = headYMax;
    //   this.state.lookLeft -= diff;
    //   this.state.lookRight -= diff;
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

  // Sets the neck rotational position. This tries to work the same way a human
  // neck would, excluding tilting.
  setNeckPosition(x, y) {
    if (!this._pluginCache.allPluginsLoaded) {
      return;
    }

    this.constrainNeck(x, headXMax, this.state, 'lookLeft', 'lookRight');
    this.constrainNeck(y, headYMax, this.state, 'lookUp', 'lookDown');

    // Note: don't use delta here. We don't want mouse speed to be dependent on
    // framerate.
    applyPolarRotation(
      x * MOUSE_SPEED,
      y * MOUSE_SPEED,
      this._pluginCache.camera.quaternion,
    );
  }

  stepAim(delta) {
    const state = this.state;
    // state.yawLeft = Math.min(state.yawLeft, -1);
    // state.yawRight = Math.max(state.yawRight, 1);
    // state.yawLeft = lerpToZero(signRelativeMax(state.yawLeft, 1), delta);
    // state.yawRight = lerpToZero(signRelativeMax(state.yawRight, 1), delta);
    // state.yawLeft = lerpToZero(signRelativeMax(state.yawLeft, 1), delta);
    // state.yawRight = lerpToZero(signRelativeMax(state.yawRight, 1), delta);
    // state.pitchUp = signRelativeMax(state.pitchUp, 1);
    // state.pitchDown = signRelativeMax(state.pitchDown, 1);
    // state.rollLeft = signRelativeMax(state.rollLeft, 1);
    // state.rollRight = signRelativeMax(state.rollRight, 1);

    // console.log('149 ->', {
    //   yawLeft: state.yawLeft,
    //   yawRight: state.yawRight,
    //   // pitchUp: state.pitchUp,
    //   // pitchDown: state.pitchDown,
    //   // rollLeft: state.rollLeft,
    //   // rollRight: state.rollRight,
    // });
  }

  stepFreeLook() {
    let x = this.state.lookLeft + this.state.lookRight;
    let y = this.state.lookUp + this.state.lookDown;
    this.setNeckPosition(x, y);
  }

  processShipControls(delta, bigDelta) {
    this._throttlePosition = clamp(this.state.thrustIncDec + this.activeState.thrustIncDec, -1, 1);
    // The pretty position is a way of making very sudden changes (like with a
    // keyboard button press) look a bit more natural by gradually going to
    // where it needs to, but does not reduce actual throttle position.
    this._prettyPosition = chaseValue(delta * 25, this._prettyPosition, this._throttlePosition);

    Core.unifiedView.throttlePosition = this._throttlePosition;
    Core.unifiedView.throttlePrettyPosition = this._prettyPosition;
  }

  step(delta, bigDelta) {
    this.processShipControls(delta, bigDelta);
  }

  // step(delta) {
  //   if (!this.state.mouseHeadLook) {
  //     this.resetNeckAxesInput();
  //     this.stepAim(delta);
  //   }
  //   else {
  //     this.resetPrincipleAxesInput();
  //     this.stepFreeLook();
  //   }
  // }
}

const shipPilotPlugin = new CosmosisPlugin('shipPilot', ShipPilot);

export {
  ShipPilot,
  shipPilotPlugin,
}
