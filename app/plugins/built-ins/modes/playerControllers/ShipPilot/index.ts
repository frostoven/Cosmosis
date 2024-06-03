// Note:
// shipPilot mode does not do anything to the spaceship, or to space. It
// tells Navigation (or SpacetimeControl?) that space is being warped, or that
// bubbles are being entered/exited. It's Nav's (or SpacetimeControl's) job to
// figure out what that means.

import { Camera } from 'three';
import Core from '../../../Core';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { shipPilotControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import {
  applyPolarRotation,
  chaseValue,
  clamp,
} from '../../../../../local/mathUtils';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import Player from '../../../Player';
import LevelScene from '../../../LevelScene';
import { EciEnum } from '../../../shipModules/types/EciEnum';
import {
  PropulsionManagerECI,
} from '../../../shipModules/PropulsionManager/types/PropulsionManagerECI';
import speedTracker from '../../../../../local/speedTracker';
import { SpacetimeControl } from '../../../SpacetimeControl';

const debugPositionAndSpeed = true;

// TODO: move me into user profile.
const MOUSE_SPEED = 0.7;
const PITCH_DIRECTION = -1;

// Maximum number x-look can be at.
const headXMax = 2200;
// Maximum number y-look can be at.
const headYMax = 1150;

const animationData = Core.animationData;
const helmView = Core.unifiedView.helm;

type PluginCompletion = PluginCacheTracker & {
  player: Player,
  camera: Camera,
  inputManager: InputManager,
  levelScene: LevelScene,
};

// Pilot control interface.
class ShipPilot extends ModeController {
  private _prettyPosition: number = 0;
  // Important for input devices such as keyboards. Not used by analog devices.
  private _throttleAccumulation: number = 0;
  // Combines keyboard and analog outputs. Is the final source of truth.
  private _throttlePosition: number = 0;
  private _pluginCache: PluginCacheTracker | PluginCompletion;

  constructor() {
    const uiInfo = { friendly: 'Ship Pilot Controls', priority: 80 };
    super('shipPilot', ModeId.playerControl, shipPilotControls, uiInfo);

    this._pluginCache = new PluginCacheTracker(
      [ 'player', 'core', 'inputManager', 'levelScene' ],
      { player: { camera: 'camera' } },
    );

    // This controller activates itself by default:
    this._pluginCache.inputManager.activateController(ModeId.playerControl, this.name);

    // This controller activates itself by default:
    this._pluginCache.inputManager = gameRuntime.tracked.inputManager.cachedValue;
    // this._pluginCache.inputManager.activateController(ModeId.playerControl, this.name);

    this._setupPulseListeners();

    if (debugPositionAndSpeed) {
      gameRuntime.tracked.spacetimeControl.getOnce((location: SpacetimeControl) => {
        gameRuntime.tracked.player.getOnce(({ camera }) => {
          // @ts-ignore
          this.speedTimer = speedTracker.trackCameraSpeed(location._reality, this._pluginCache.camera);
        });
      });
    }
  }

  _setupPulseListeners() {
    this.pulse.mouseHeadLook.getEveryChange(() => {
      this.state.mouseHeadLook = Number(!this.state.mouseHeadLook);
      this.resetLookState();
    });

    this.pulse.thrustReset.getEveryChange(() => {
      // Local accumulation cache.
      this._throttleAccumulation = 0;
      this._throttlePosition = 0;
      // Tracked input state.
      this.activeState.thrustAnalog = 0;
      this.state.thrustAnalog = 0;
    });

    this.pulse.cycleEngineType.getEveryChange(() => {
      // Inform the propulsion manager of what's going on.
      const level: LevelScene = this._pluginCache.levelScene;
      const eciLookup = level.getElectronicControlInterface(EciEnum.propulsion);
      if (eciLookup) {
        const eci = eciLookup.getEci() as PropulsionManagerECI;
        eci.cli.cycleEngineType();
      }
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
    this.state.thrustAnalog = clamp(value, -1, 1);
    this.activeState.thrustAnalog = 0;
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

  stepFreeLook() {
    let x = this.state.lookLeft + this.state.lookRight;
    let y = this.state.lookUp + this.state.lookDown;
    this.setNeckPosition(x, y);
  }

  /**
   * Used for situations where input can gradually build up a slider, such as
   * using the keyboard to push up a persistent throttle.
   */
  computeSliderBuildup(
    accumulated: number,
    absoluteNext: number,
    cumulativeNext: number,
    upperBound: number | null,
  ) {
    upperBound === null && (upperBound = 1);

    // What this looked like before it was made generic:
    //  throttleAccumulation = clamp(throttleAccumulation + activeState.thrustAnalog, -1, upperBound);
    //  throttlePosition = clamp(throttleAccumulation + state.thrustAnalog, -1, upperBound);
    accumulated = clamp(accumulated + absoluteNext, -1, upperBound);
    const actualPosition = clamp(accumulated + cumulativeNext, -1, upperBound);
    return [ accumulated, actualPosition ];
  }

  processThrottle(delta: number, bigDelta: number) {
    // Prevent reversing throttle if the engine does not allow it. We limit +1
    // instead of -1 because analog controllers invert Y axes.
    const upperBound = Core.unifiedView.propulsion.canReverse ? 1 : 0;

    const [ accumulated, actualPosition ] = this.computeSliderBuildup(
      this._throttleAccumulation,
      // Active state accumulates from digital inputs, so it needs a delta.
      this.activeState.thrustAnalog * bigDelta,
      // Passive state is an absolute value, so no delta is applied.
      this.state.thrustAnalog,
      upperBound,
    );

    this._throttleAccumulation = accumulated;
    this._throttlePosition = actualPosition;

    // The pretty position is a way of making very sudden changes (like with a
    // keyboard button press) look a bit more natural by gradually going to
    // where it needs to, but does not reduce actual throttle position.
    if (this._prettyPosition !== this._throttlePosition) {
      this._prettyPosition = chaseValue(
        delta * 25, this._prettyPosition,
        this._throttlePosition,
      );
    }

    // Invert the throttle values stored in the unified view because
    // controllers for some reason use -1 for 100% and +1 for 0%.
    helmView.throttlePosition = -this._throttlePosition;
    helmView.throttlePrettyPosition = -this._prettyPosition;
  }

  processRotation(bigDelta: number) {
    // We just outright use absolute values without further processing because
    // we don't let rotations "build up". That's because the propulsion engine
    // itself decides if and how build-up will happen based on flightAssist.
    // console.log('passive:', this.state.pitchAnalog, 'active:', this.activeState.pitchAnalog);
    helmView.pitch = clamp(
      this.state.pitchAnalog + this.activeState.pitchAnalog, -1, 1,
    ) * PITCH_DIRECTION;
    helmView.yaw = -clamp(
      this.state.yawAnalog + this.activeState.yawAnalog, -1, 1,
    );
    helmView.roll = -clamp(
      this.state.rollAnalog + this.activeState.rollAnalog, -1, 1,
    );
  }

  step() {
    super.step();
    const { delta, bigDelta } = animationData;
    this.processThrottle(delta, bigDelta);
    this.processRotation(bigDelta);
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
};
