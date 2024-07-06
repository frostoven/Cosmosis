// Note:
// helmControl mode does not do anything to the spaceship, or to space. It
// aggregates digital and analog input states into single values and reports
// those to the ship's unified view.

import * as THREE from 'three';
import Core from '../../../Core';
import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { helmControls } from './controls';
import { ModeId } from '../../../InputManager/types/ModeId';
import { gameRuntime } from '../../../../gameRuntime';
import { InputManager } from '../../../InputManager';
import {
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
import {
  logBootTitleAndInfo,
} from '../../../../../local/windowLoadListener';
import PluginLoader from '../../../../types/PluginLoader';

const debugPositionAndSpeed = true;

const animationData = Core.animationData;
const helmView = Core.unifiedView.helm;

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  player: Player,
  inputManager: InputManager,
  levelScene: LevelScene,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: THREE.Camera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------

/**
 * Represents the pilot control interface. Think of this as the bridge ship
 * control terminal
 */
class HelmControl extends ModeController {
  // If true, flight controls will move the player head around. If false,
  // player controls will move the ship around.
  private _headLookActive: boolean = false;
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  // Important for input devices such as keyboards. Not used by analog devices.
  private _throttleAccumulation: number = 0;
  private _pitchAccumulation: number = 0;
  private _yawAccumulation: number = 0;
  private _rollAccumulation: number = 0;

  // Combines keyboard and analog outputs. Is the final source of truth.
  private _throttlePosition: number = 0;

  // Exists exclusively to make the UI appear nicer.
  private _prettyThrottlePosition: number = 0;

  constructor() {
    logBootTitleAndInfo('Driver', 'Helm Control', PluginLoader.bootLogIndex);
    const uiInfo = { friendly: 'Ship Pilot Controls', priority: 80 };
    super('helmControl', ModeId.flightControl, helmControls, uiInfo);

    // This controller activates itself by default:
    this._pluginCache.inputManager.activateController(ModeId.flightControl, this.name);

    // This controller activates itself by default:
    this._pluginCache.inputManager = gameRuntime.tracked.inputManager.cachedValue;
    // this._pluginCache.inputManager.activateController(ModeId.playerControl, this.name);

    this._setupPulseListeners();

    if (debugPositionAndSpeed) {
      gameRuntime.tracked.spacetimeControl.getOnce((location: SpacetimeControl) => {
        gameRuntime.tracked.player.getOnce(({ camera }) => {
          // @ts-ignore
          this.speedTimer = speedTracker.trackCameraSpeed(
            location.getLocalSpaceContainer(),
            camera,
          );
        });
      });
    }
  }

  _setupPulseListeners() {
    this.pulse.mouseHeadLook.getEveryChange(() => {
      this._headLookActive = !this._headLookActive;
      const level: LevelScene = this._pluginCache.levelScene;
      level.resetCameraSeatPosition();
      this.resetLookState();

      if (this._headLookActive) {
        this.activateHeadLook();
      }
      else {
        this.deactivateHeadLook();
      }
    });

    this.pulse.toggleFlightAssist.getEveryChange(() => {
      helmView.flightAssist = !helmView.flightAssist;
    });

    this.pulse.thrustReset.getEveryChange(() => {
      // Local accumulation cache.
      this._throttleAccumulation = 0;
      this._throttlePosition = 0;
      // Tracked input state.
      this.cumulativeInput.thrustAnalog = 0;
      this.absoluteInput.thrustAnalog = 0;
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
      this.deactivateHeadLook();
      this._pluginCache.inputManager.activateController(ModeId.flightControl, 'freeCam');
    });
  }

  // ----------------------------------------------------------------------- //

  activateHeadLook() {
    this._headLookActive = true;
    this.hideCrosshairs();
    this._pluginCache.inputManager.activateController(
      ModeId.buckledPassenger, 'buckledPassenger',
    );
  }

  deactivateHeadLook() {
    this._headLookActive = false;
    this.showCrosshairs();
    this._pluginCache.inputManager.deactivateController(
      ModeId.buckledPassenger, 'buckledPassenger',
    );
  }

  showCrosshairs() {
    // This needs to evolve to something less crude, but is good enough for now.
    const crosshairs = document.getElementById('crosshairs');
    if (crosshairs) {
      crosshairs.style.display = 'block';
    }
  }

  hideCrosshairs() {
    // This needs to evolve to something less crude, but is good enough for now.
    const crosshairs = document.getElementById('crosshairs');
    if (crosshairs) {
      crosshairs.style.display = 'none';
    }
  }

  // ----------------------------------------------------------------------- //

  onActivateController() {
    gameRuntime.tracked.levelScene.getOnce((levelScene: LevelScene) => {
      levelScene.resetCameraSeatPosition();
    });

    this.resetLookState();
    this.activateHeadLook();
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
    if (helmView.flightAssist) {
      this.absoluteInput.pitchAnalog = 0;
      this.absoluteInput.yawAnalog = 0;
      this.absoluteInput.rollAnalog = 0;
    }
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

  processWarpThrottle(delta: number, bigDelta: number) {
    // Prevent reversing throttle if the engine does not allow it. We limit +1
    // instead of -1 because analog controllers invert Y axes.
    const upperBound = Core.unifiedView.propulsion.canReverse ? 1 : 0;

    const [ accumulated, actualPosition ] = this.computeSliderBuildup(
      this._throttleAccumulation,
      // This accumulates from digital inputs over time, so it needs a delta.
      this.cumulativeInput.thrustAnalog * bigDelta,
      // This is an absolute value (e.g. from a stick), so no delta is applied.
      this.absoluteInput.thrustAnalog,
      upperBound,
    );

    this._throttleAccumulation = accumulated;
    this._throttlePosition = actualPosition;

    // The pretty position is a way of making very sudden changes (like with a
    // keyboard button press) look a bit more natural by gradually going to
    // where it needs to, but does not reduce actual throttle position.
    if (this._prettyThrottlePosition !== this._throttlePosition) {
      this._prettyThrottlePosition = chaseValue(
        delta * 25, this._prettyThrottlePosition,
        this._throttlePosition,
      );
    }

    // Invert the throttle values stored in the unified view because
    // controllers for some reason use -1 for 100% and +1 for 0%.
    helmView.throttlePosition = -this._throttlePosition;
    helmView.throttlePrettyPosition = -this._prettyThrottlePosition;
  }

  processWarpRotation(delta: number) {
    // Temp vars we reuse for all rotations.
    let accumulated: number;
    let actualPosition: number;

    // -- Pitch -------------------------------------------------- /

    [ accumulated, actualPosition ] = this.computeSliderBuildup(
      this._pitchAccumulation,
      // This accumulates from digital inputs over time, so it needs a delta.
      this.cumulativeInput.pitchAnalog * delta,
      // This is an absolute value (e.g. from a stick), so no delta is applied.
      this.absoluteInput.pitchAnalog,
      null,
    );

    this._pitchAccumulation = accumulated;
    helmView.pitch = -actualPosition;

    // -- Yaw ---------------------------------------------------- /

    [ accumulated, actualPosition ] = this.computeSliderBuildup(
      this._yawAccumulation,
      // This accumulates from digital inputs over time, so it needs a delta.
      this.cumulativeInput.yawAnalog * delta,
      // This is an absolute value (e.g. from a stick), so no delta is applied.
      this.absoluteInput.yawAnalog,
      null,
    );

    this._yawAccumulation = accumulated;
    helmView.yaw = -actualPosition;

    // -- Roll --------------------------------------------------- /

    [ accumulated, actualPosition ] = this.computeSliderBuildup(
      this._rollAccumulation,
      // This accumulates from digital inputs over time, so it needs a delta.
      this.cumulativeInput.rollAnalog * delta,
      // This is an absolute value (e.g. from a stick), so no delta is applied.
      this.absoluteInput.rollAnalog,
      null,
    );

    this._rollAccumulation = accumulated;
    helmView.roll = -actualPosition;

    // -- Flight assist ------------------------------------------ /

    if (helmView.flightAssist) {
      // The negation checks here ensure that we only apply assist corrections
      // when the user has reset their input position to zero.
      if (!this.cumulativeInput.pitchAnalog) {
        this._pitchAccumulation = chaseValue(delta * 0.5, this._pitchAccumulation, 0);
      }
      if (!this.cumulativeInput.yawAnalog) {
        this._yawAccumulation = chaseValue(delta * 0.5, this._yawAccumulation, 0);
      }
      if (!this.cumulativeInput.rollAnalog) {
        this._rollAccumulation = chaseValue(delta * 0.5, this._rollAccumulation, 0);
      }
    }
  }

  step() {
    super.step();
    const { delta, bigDelta } = animationData;
    this.processWarpThrottle(delta, bigDelta);
    this.processWarpRotation(delta);
  }
}

const helmControlPlugin = new CosmosisPlugin(
  'helmControl', HelmControl, pluginDependencies,
);

export {
  HelmControl,
  helmControlPlugin,
};
