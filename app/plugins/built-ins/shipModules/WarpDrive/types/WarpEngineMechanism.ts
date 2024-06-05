import * as THREE from 'three';
import { WarpEngineType } from './WarpEngineType';
import { gameRuntime } from '../../../../gameRuntime';
import { SpacetimeControl } from '../../../SpacetimeControl';
import { HelmControl } from '../../../modes/playerControllers/HelmControl';
import Core from '../../../Core';
import LevelScene from '../../../LevelScene';
import SpaceScene from '../../../SpaceScene';
import {
  chaseValue,
  clamp,
} from '../../../../../local/mathUtils';
import FastDeterministicRandom
  from '../../../../../random/FastDeterministicRandom';

const { linearAcceleration, exponentialAcceleration } = WarpEngineType;

const { abs, exp, max, round } = Math;

const debugWarpStatus = true;

const animationData = Core.animationData;
const helmView = Core.unifiedView.helm;
const propulsionView = Core.unifiedView.propulsion;

// TODO: Refactor this into the SpacetimeControl module.
// Just to alleviate some confusion: 1 means 'nothing', less then 1 is negative
// ambient energy. In other words, this number should always be 1 or more. It
// gets exponentially higher as you get closer to a planet/star/whatever.
const ambientGravity = 1;

export default class WarpEngineMechanism {
  // 195 = 1,000c, 199 = 1,500c, 202 = 2,000c, 206 = 3,000c, 209 = 4,000c,
  // 300 = 35,600,000c (avoid going over 209).
  // The idea is that the player can push this number up infinitely, but with
  // huge falloff past 206 because every extra 0.1 eventually scales to 1c
  // faster. 195 is junk, 199 is beginner. 206 is end-game. 209 is something
  // achievable only through insane grind.
  public maxSpeed: number = 209; //209;
  // 195=1kc, 199=1.5kc, 202=2kc, 206=3kc, 209=4kc.
  public currentSpeed: number = 0;
  // Throttle. 0-100.
  public currentThrottle: number = 0;
  // 0-100 - lags behind real throttle, and struggles at higher numbers.
  public actualThrottle: number = 0;
  // Instantly pushes warp speed to max, bypassing acceleration and gravitational
  // drag.
  public debugFullWarpSpeed: boolean = false;
  // Hyperdrive rotation speed.
  public pitchMaxSpeed: number = 1.1;
  public pitchAcceleration: number = 0.01;
  // Yaw is slower with real aircraft. It doesn't really make sense for a warp
  // drive, but it's painful when you're used to a snappy warp bubble and then
  // drop to impulse just to feel like you're being dragged through mud. We
  // should probably allow players to unlock this via ship customization.
  public yawMaxSpeed: number = 1.1;
  private yawAcceleration: number = 0.005; // 0.0025;;
  //
  public rollAcceleration: number = 0.01;
  public rollMaxSpeed: number = 1.1;
  // Used to ease in/out of spinning.
  public rollBuildup: number = 0;
  // Used to ease in/out of spinning.
  public yawBuildup: number = 0;
  // Used to ease in/out of spinning.
  public pitchBuildup: number = 0;
  // Flight assist causes the engines to blast in various directions to correct
  // ship movement, thus taking main power away from what the user is
  // explicitly pressing, or so it is told. This is multiplied by rotational
  // speeds to speed down the ship while flight assist is on.
  public flightAssistPenaltyFactor: number = 0.9;
  // Honestly unsure which one to use, so offering both to devs at the moment.
  // Note that the top speed for all engine types is the same. Something to
  // consider: we'll have gravity to hurt our acceleration, so exponential might
  // be annoyingly slow when inside a solar system.
  public engineType: WarpEngineType = WarpEngineType.exponentialAcceleration;
  public maxThrottle: number = 100;
  public severelyDamaged: boolean = false;

  private _cachedSpacetime: SpacetimeControl;
  private _cachedShipPilot: HelmControl;
  private _cachedLevelScene: LevelScene;
  private _cachedSpaceScene: SpaceScene;
  private _cachedCamera: THREE.PerspectiveCamera;

  constructor() {
    this._cachedSpacetime = gameRuntime.tracked.spacetimeControl.cachedValue;
    this._cachedShipPilot = gameRuntime.tracked.helmControl.cachedValue;
    this._cachedLevelScene = gameRuntime.tracked.levelScene.cachedValue;
    this._cachedSpaceScene = gameRuntime.tracked.spaceScene.cachedValue;
    this._cachedCamera = gameRuntime.tracked.player.cachedValue.camera;
    this._setupWatchers();
  }

  _setupWatchers() {
    gameRuntime.tracked.spacetimeControl.getEveryChange((location: SpacetimeControl) => {
      this._cachedSpacetime = location;
    });
    gameRuntime.tracked.helmControl.getEveryChange((helmControl: HelmControl) => {
      this._cachedShipPilot = helmControl;
    });
    gameRuntime.tracked.levelScene.getEveryChange((levelScene: LevelScene) => {
      this._cachedLevelScene = levelScene;
    });
    gameRuntime.tracked.levelScene.getEveryChange((spaceScene: SpaceScene) => {
      this._cachedSpaceScene = spaceScene;
    });
    gameRuntime.tracked.player.getEveryChange((player: {
      camera: THREE.PerspectiveCamera;
    }) => {
      this._cachedCamera = player.camera;
    });
  }

  reset() {
    this.yawBuildup = 0;
    this.pitchBuildup = 0;
    this.rollBuildup = 0;
  }

  /**
   * Used to slow the throttle needle following the player's request.
   */
  dampenTorque(delta: number, value: number, target: number, growthSpeed: number) {
    growthSpeed *= delta;
    if (value < target) {
      return value + growthSpeed;
    }
    else {
      return value - growthSpeed;
    }
  }

  /**
   * Used to slow the throttle needle more as it approaches 100% engine power.
   * Similar to dampenTorque, but here the growth speed is dynamic.
   */
  dampenByFactor(delta: number, value: number, target: number) {
    let result: number;
    // Do not use delta here - it's applied in dampenTorque.
    const warpFactor = 4; // equivalent to delta [at 0.016] * 250 growth.

    // If accelerating, the throttle changes slowly. If decelerating, the
    // throttle changes quickly. The reason we check in a range is to reduce
    // throttle flickering due to delta fluctuations; else, we'd just do a '>'.
    if (target >= value * 0.9) {
      const ratio = -((this.actualThrottle / (this.maxThrottle / ambientGravity)) - 1);
      result = this.dampenTorque(delta, value, target, ratio * warpFactor);
    }
    else {
      // Allow fast deceleration.
      result = this.dampenTorque(delta, value, target, warpFactor ** 2);
    }

    if (result < 0) {
      return 0;
    }
    return result;
  }

  /**
   * Blows meters per second into light years per second for fun and profit.
   * @param amount
   */
  scaleHyperSpeed(amount: number) {
    return exp(amount / 10);
  }

  applyMovement(delta: number) {
    // Can't reverse when in a warp field.
    if (this.currentThrottle < 0) {
      this.currentThrottle = 0;
    }

    const throttle = (this.currentThrottle / this.maxThrottle) * 100;
    let actualThrottle = this.actualThrottle;

    actualThrottle = this.dampenByFactor(delta, actualThrottle, throttle);
    if (actualThrottle > this.maxThrottle - 0.01) {
      // This helps prevent a bug where the throttle can sometimes get stuck at
      // more than 100%; when this happens, throttling down does nothing and
      // gravity increases acceleration.
      actualThrottle = throttle - 0.01;
    }
    this.actualThrottle = actualThrottle;

    if (this.debugFullWarpSpeed) {
      this.actualThrottle = this.maxThrottle;
    }

    this.currentSpeed = (actualThrottle / 100) * this.maxSpeed;

    let hyperSpeed: number;
    if (this.engineType === linearAcceleration) {
      const maxHyper = this.scaleHyperSpeed(this.maxSpeed);
      hyperSpeed = (actualThrottle / 100) * maxHyper;
    }
    else if (this.engineType === exponentialAcceleration) {
      hyperSpeed = this.scaleHyperSpeed(this.currentSpeed);
    }
    else {
      // Very slow, reduces speed to meters per second.
      hyperSpeed = this.currentSpeed;
    }

    if (!hyperSpeed) {
      return;
    }

    hyperSpeed *= delta * 100;

    // Move the world around the ship.

    this._cachedSpacetime.moveForwardPlayerCentric(hyperSpeed, this._cachedLevelScene);
  }

  applyRotation(delta: number, bigDelta: number) {
    const pitch = clamp(helmView.pitch, -1, 1);
    const yaw = clamp(helmView.yaw, -1, 1);
    const roll = clamp(helmView.roll, -1, 1);

    let pitchMax: number;
    let yawMax: number;
    let rollMax: number;
    if (helmView.flightAssist) {
      pitchMax = this.pitchMaxSpeed * this.flightAssistPenaltyFactor;
      yawMax = this.yawMaxSpeed * this.flightAssistPenaltyFactor;
      rollMax = this.rollMaxSpeed * this.flightAssistPenaltyFactor;
    }
    else {
      pitchMax = this.pitchMaxSpeed;
      yawMax = this.yawMaxSpeed;
      rollMax = this.rollMaxSpeed;
    }

      if (pitch || this.pitchBuildup) {
        this.pitchBuildup = chaseValue(delta * 0.5, this.pitchBuildup, pitch);
      }
      if (yaw || this.yawBuildup) {
        this.yawBuildup = chaseValue(delta * 0.5, this.yawBuildup, yaw);
      }
      if (roll || this.rollBuildup) {
        this.rollBuildup = chaseValue(delta * 0.5, this.rollBuildup, roll);
      }

    this.pitchBuildup = clamp(this.pitchBuildup, -pitchMax, pitchMax);
    this.yawBuildup = clamp(this.yawBuildup, -yawMax, yawMax);
    this.rollBuildup = clamp(this.rollBuildup, -rollMax, rollMax);

    this._cachedSpacetime.rotatePlayerCentric(
      this.pitchBuildup * this.pitchAcceleration,
      this.yawBuildup * this.yawAcceleration,
      this.rollBuildup * this.rollAcceleration,
    );
  }

  // FIXME: update me to work with new plugin system.
  stepWarp(spacetimeControl: SpacetimeControl) {
    if (!this._cachedShipPilot) {
      return;
    }

    const { delta, bigDelta } = animationData;

    this.applyMovement(delta);
    this.applyRotation(delta, bigDelta);

    propulsionView.currentSpeedLy = this.currentSpeed;
    propulsionView.outputLevel = this.actualThrottle * 0.01;

    if (!this.severelyDamaged) {
      // Thanks to delta fluctuations, the HUD flickers severely like a broken
      // LED panel. chaseValue here with the 0.1 factor ensures we interpolate
      // fast on massive change and slowly on subtle change, thus killing the
      // flicker. That's also why we skip this during damage: It adds to the
      // broken ship effect.
      propulsionView.outputLevelPretty = chaseValue(
        abs(propulsionView.outputLevel - propulsionView.outputLevelPretty) * 0.1,
        propulsionView.outputLevelPretty,
        propulsionView.outputLevel,
      );
    }
    else {
      const rng = FastDeterministicRandom.bad();
      if (rng > 0.9) {
        propulsionView.outputLevelPretty = 0;
      }
      else {
        propulsionView.outputLevelPretty =
          max(0, propulsionView.outputLevel + FastDeterministicRandom.bad() * 0.01);
      }
    }

    if (debugWarpStatus) {
      const div = document.getElementById('hyperdrive-stats');
      if (div) {
        const throttle = round((this.currentThrottle / this.maxThrottle) * 100);
        div.innerText = `
          y: ${throttle}%
          Player throttle: ${throttle}% (${round(this.currentThrottle)}/${this.maxThrottle})
          Actual throttle: ${propulsionView.outputLevel.toFixed(3)}
          Pretty actual: ${propulsionView.outputLevelPretty.toFixed(3)}
      `;
      }
    }
  }
}
