import * as THREE from 'three';
import { WarpEngineType } from './WarpEngineType';
import { gameRuntime } from '../../../../gameRuntime';
import { SpacetimeControl } from '../../../SpacetimeControl';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';
import Core from '../../../Core';
import LevelScene from '../../../LevelScene';
import SpaceScene from '../../../SpaceScene';
import { chaseValue, clamp, lerp } from '../../../../../local/mathUtils';

const { linearAcceleration, exponentialAcceleration } = WarpEngineType;
const helmView = Core.unifiedView.helm;

// TODO: Refactor this into the SpacetimeControl module.
// Just to alleviate some confusion: 1 means 'nothing', less then 1 is negative
// ambient energy. In other words, this number should always be 1 or more. It
// gets exponentially higher as you get closer to a planet/star/whatever.
const ambientGravity = 1;
let _tmpDirection = new THREE.Vector3();

export default class WarpEngineMechanism {
  // 195 = 1,000c, 199 = 1,500c, 202 = 2,000c, 206 = 3,000c, 209 = 4,000c,
  // 300 = 35,600,000c (avoid going over 209).
  // The idea is that the player can push this number up infinitely, but with
  // huge falloff past 206 because every extra 0.1 eventually scales to 1c
  // faster. 195 is junk, 199 is beginner. 206 is end-game. 209 is something
  // achievable only through insane grind.
  public maxSpeed: number;
  // 195=1kc, 199=1.5kc, 202=2kc, 206=3kc, 209=4kc.
  public currentSpeed: number;
  // Throttle. 0-100.
  public currentThrottle: number;
  // 0-100 - lags behind real throttle, and struggles at higher numbers.
  public actualThrottle: number;
  // Instantly pushes warp speed to max, bypassing acceleration and gravitational
  // drag.
  public debugFullWarpSpeed: boolean;
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
  public rollBuildup: number;
  // Used to ease in/out of spinning.
  public yawBuildup: number;
  // Used to ease in/out of spinning.
  public pitchBuildup: number;
  // If true, ship will automatically try to stop rotation when the thrusters
  // aren't active.
  public flightAssist: boolean = false;
  // Flight assist causes the engines to blast in various directions to correct
  // ship movement, thus taking main power away from what the user is
  // explicitly pressing, or so it is told. This is multiplied by rotational
  // speeds to speed down the ship while flight assist is on.
  public flightAssistPenaltyFactor: number = 0.9;
  // Honestly unsure which one to use, so offering both to devs at the moment.
  // Note that the top speed for all engine types is the same. Something to
  // consider: we'll have gravity to hurt our acceleration, so exponential might
  // be annoyingly slow when inside a solar system.
  public engineType: WarpEngineType;
  public maxThrottle: number;

  private _cachedSpacetime: SpacetimeControl;
  private _cachedShipPilot: ShipPilot;
  private _cachedLevelScene: LevelScene;
  private _cachedSpaceScene: SpaceScene;
  private _cachedCamera: THREE.PerspectiveCamera;

  constructor() {
    this.maxSpeed = 195;//209;
    this.currentSpeed = 0;
    this.currentThrottle = 0;
    this.actualThrottle = 0;
    this.debugFullWarpSpeed = false;
    this.rollBuildup = 0;
    this.yawBuildup = 0;
    this.pitchBuildup = 0;
    this.engineType = WarpEngineType.linearAcceleration;
    this.maxThrottle = 100;

    this._cachedSpacetime = gameRuntime.tracked.spacetimeControl.cachedValue;
    this._cachedShipPilot = gameRuntime.tracked.shipPilot.cachedValue;
    this._cachedLevelScene = gameRuntime.tracked.levelScene.cachedValue;
    this._cachedSpaceScene = gameRuntime.tracked.spaceScene.cachedValue;
    this._cachedCamera = gameRuntime.tracked.player.cachedValue.camera;
    this._setupWatchers();
  }

  _setupWatchers() {
    gameRuntime.tracked.spacetimeControl.getEveryChange((location: SpacetimeControl) => {
      this._cachedSpacetime = location;
    });
    gameRuntime.tracked.shipPilot.getEveryChange((shipPilot: ShipPilot) => {
      this._cachedShipPilot = shipPilot;
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
   * Changes the throttle by the specified percentage.
   * @param delta
   * @param {number} amount - Decimal percentage.
   */
  changeThrottle(delta: number, amount: number) {
    return (this.maxThrottle * amount) * (delta * 60);
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
    if (target > value) {
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
  scaleHyperSpeed(amount) {
    return Math.exp(amount / 10);
  }

  /**
   * Function that eases into targets.
   */
  // easeIntoBuildup(delta, buildup, target, rollSpeed, factor=1) {
  //   // rollSpeed *= delta;
  //   const total = (target + buildup);
  //
  //   if (Math.abs(total) > rollSpeed) {
  //     return rollSpeed * Math.sign(total);
  //   }
  //
  //   return total * factor;
  // }
  // easeIntoBuildup(delta, buildup, rollSpeed, factor, direction=1) {
  //   buildup = Math.abs(buildup);
  //
  //   const effectiveSpin = (rollSpeed * delta) * factor;
  //   buildup += effectiveSpin;
  //   if (buildup > effectiveSpin) {
  //     buildup = effectiveSpin;
  //   }
  //
  //   return buildup * direction;
  // };

  easeOutOfBuildup(delta: number, rollBuildup: number, easeFactor: number) {
    if (Math.abs(rollBuildup) < delta * 0.1) {
      rollBuildup = 0;
    }
    else {
      rollBuildup /= 1 + (easeFactor * delta);
    }

    return rollBuildup;
  }

  easeIntoBuildup(
    delta: number,
    currentValue: number,
    requestedValue: number,
    maxAllowed: number,
    acceleration = 1,
  ) {
    let currentAbs = Math.abs(currentValue);
    let requestedAbs = Math.abs(requestedValue);
    let maxAbs = Math.abs(maxAllowed);

    if (requestedAbs > maxAbs) {
      requestedAbs = maxAbs;
    }

    if (currentAbs > requestedAbs) {
      // This is to prevent an automatic ease-out.
      return currentValue;
    }

    currentAbs += (delta * acceleration);
    if (currentAbs > requestedAbs) {
      return requestedAbs * (Math.sign(requestedValue) || 1);
    }
    else {
      return currentAbs * (Math.sign(requestedValue) || 1);
    }
  }

  quadEaseOut(time: number, startValue: number, change: number, duration: number) {
    time /= duration / 2;
    if (time < 1) {
      return change / 2 * time * time + startValue;
    }

    time--;
    return -change / 2 * (time * (time - 2) - 1) + startValue;
  };

  lerp(t, b, c, d) {
    return c * t / d + b;
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

    // if (debugFullWarpSpeed) {
    //   actualThrottle = maxThrottle;
    // }

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

    hyperSpeed *= delta;

    // TODO: Continue from here - Test if this reduces large body lag. Also,
    //  add a dark border around your reticle for pretties.
    //  Also, add fucking mouse aim support.
    //  I think the solution is to have levelScene and spaceScene add
    //  themselves to spacetimeControl. spacetimeControl can then have a group
    //  it shifts around.
    //  //
    //  ALTHOUGH - frames drop pretty heavily for space scene. I saw a drop to
    //  34FPS. It's possible this isn't a simple fix, and that space scene is
    //  doing something incredibly dumb. Please investigate.

    // Move the world around the ship.
    this._cachedCamera.getWorldDirection(_tmpDirection);
    this._cachedLevelScene.position.addScaledVector(_tmpDirection, hyperSpeed);
    this._cachedSpaceScene.position.addScaledVector(_tmpDirection, hyperSpeed);
    this._cachedSpacetime.add(_tmpDirection, -hyperSpeed);
    // console.log('hyperSpeed:', hyperSpeed, 'currentThrottle:', this.currentThrottle);
  }

  applyRotation(delta: number, bigDelta: number) {
    // const state = this._cachedShipPilot.state;
    // // console.log('[applyRotation]', {
    // //   passive: this._cachedShipPilot.state,
    // //   active: this._cachedShipPilot.activeState,
    // // });
    //
    // const {
    //   pitchDown, pitchUp, rollLeft, rollRight, yawLeft, yawRight,
    // } = this._cachedShipPilot.state;
    //
    // // console.log({ pitchDown, pitchUp, rollLeft, rollRight, yawLeft, yawRight });
    //
    // const rotation = this._cachedLocation.universeRotationM;
    //
    // // const yaw = yawLeft + yawRight;
    // // const pitch = pitchUp - pitchDown;
    // // const roll = rollLeft - rollRight;
    //
    //
    // // ---------------
    // // let yaw = (state.yawLeft + state.yawRight) * 0.00001;
    // // let pitch = (state.pitchUp + state.pitchDown) * 0.00001;
    // // let roll = (state.rollLeft + state.rollRight) * 0.0001;
    // let yaw = state.yawLeft + state.yawRight;
    // let pitch = state.pitchUp + state.pitchDown;
    // let roll = state.rollLeft + state.rollRight;
    //
    // // if (yaw) {
    // //
    // // }
    //
    // // this.rollBuildup = this.easeIntoBuildup(delta, this.rollBuildup, roll, this.rollSpeed, 0.01);
    // // this.rollBuildup = this.lerp();
    //
    // // console.log({roll, rollBuildup: this.rollBuildup });
    //
    // // state.yawRight = yaw;
    // // state.yawLeft = -yaw;
    // // ---------------
    // rotation.rotateY(signRelativeMax(-yaw, this.pitchAndYawSpeed));
    // rotation.rotateX(signRelativeMax(-pitch, this.pitchAndYawSpeed));
    // rotation.rotateZ(this.rollBuildup);
    // // ---------------
    //
    //
    // // console.log('172 ->', { yaw, pitch, roll });
    // // console.log('172 ->', { yaw });
    // if (pitch || this.pitchBuildup) {
    //   // this.pitchBuildup = this.easeIntoBuildup(
    //   //   delta, this.pitchBuildup, pitch, this.pitchSpeed,
    //   // );
    //   this.pitchBuildup = chaseValue(delta * 5, this.pitchBuildup, pitch);
    // }
    //
    // if (yaw || this.yawBuildup) {
    //   // this.yawBuildup = this.easeIntoBuildup(
    //   //   delta, this.yawBuildup, yaw, this.yawSpeed,
    //   // );
    //   this.yawBuildup = chaseValue(delta * 5, this.yawBuildup, yaw);
    // }
    //
    // if (roll || this.rollBuildup) {
    //   // this.rollBuildup = this.easeIntoBuildup(
    //   //   delta, this.rollBuildup, roll, this.rollSpeed,
    //   // );
    //   this.rollBuildup = chaseValue(delta * 5, this.rollBuildup, roll);
    // }

    const { pitch, yaw, roll } = helmView;

    // const pitch = Math.max(helmView.pitch, this.yawBuildup);
    // const yaw = Math.max(helmView.yaw, this.pitchBuildup);
    // const roll = Math.max(helmView.roll, this.rollBuildup);

    // const easeIntoBuildup = () => {
    //   //
    // };


    let pitchMax: number;
    let yawMax: number;
    let rollMax: number;
    if (this.flightAssist) {
      pitchMax = this.pitchMaxSpeed * this.flightAssistPenaltyFactor;
      yawMax = this.yawMaxSpeed * this.flightAssistPenaltyFactor;
      rollMax = this.rollMaxSpeed * this.flightAssistPenaltyFactor;

      if (pitch || this.pitchBuildup) {
        this.pitchBuildup = chaseValue(delta * 5, this.pitchBuildup, pitch);
      }
      if (yaw || this.yawBuildup) {
        this.yawBuildup = chaseValue(delta * 5, this.yawBuildup, yaw);
      }
      if (roll || this.rollBuildup) {
        this.rollBuildup = chaseValue(delta * 5, this.rollBuildup, roll);
      }
    }
    else {
      pitchMax = this.pitchMaxSpeed;
      yawMax = this.yawMaxSpeed;
      rollMax = this.rollMaxSpeed;

      if (pitch || this.pitchBuildup) {
        this.pitchBuildup = chaseValue(delta * 5, this.pitchBuildup, (this.pitchBuildup + pitch));
      }
      if (yaw || this.yawBuildup) {
        this.yawBuildup = chaseValue(delta * 5, this.yawBuildup, (this.yawBuildup + yaw));
      }
      if (roll || this.rollBuildup) {
        this.rollBuildup = chaseValue(delta * 5, this.rollBuildup, (this.rollBuildup + roll));
      }
    }

    this.pitchBuildup = clamp(this.pitchBuildup, -pitchMax, pitchMax);
    this.yawBuildup = clamp(this.yawBuildup, -yawMax, yawMax);
    this.rollBuildup = clamp(this.rollBuildup, -rollMax, rollMax);

    // console.log('pitchBuildup:', this.pitchBuildup, '| pitch:', pitch);
    // console.log('rollBuildup:', this.rollBuildup, '| roll:', roll);

    this._cachedSpacetime.universeRotationM.rotateX(-this.pitchBuildup * this.pitchAcceleration);
    this._cachedSpacetime.universeRotationM.rotateY(-this.yawBuildup * this.yawAcceleration);
    this._cachedSpacetime.universeRotationM.rotateZ(-this.rollBuildup * this.rollAcceleration);

    this._cachedLevelScene.rotateX(this.pitchBuildup * this.pitchAcceleration);
    this._cachedLevelScene.rotateY(this.yawBuildup * this.yawAcceleration);
    this._cachedLevelScene.rotateZ(this.rollBuildup * this.rollAcceleration);

    // if (this.flightAssist) {
    //   this.yawBuildup = this.easeOutOfBuildup(delta, this.yawBuildup, 10);
    //   this.pitchBuildup = this.easeOutOfBuildup(delta, this.pitchBuildup, 10);
    //   this.rollBuildup = this.easeOutOfBuildup(delta, this.rollBuildup, 10);
    // }

    // if (this.flightAssist) {
    //   this.yawBuildup = this.easeOutOfBuildup(delta, this.yawBuildup, 10);
    //   this.pitchBuildup = this.easeOutOfBuildup(delta, this.pitchBuildup, 10);
    //   this.rollBuildup = this.easeOutOfBuildup(delta, this.rollBuildup, 10);
    // }
  }

  // FIXME: update me to work with new plugin system.
  stepWarp(delta: number, bigDelta: number, spacetimeControl: SpacetimeControl) {
    if (!this._cachedShipPilot) {
      return;
    }

    this.applyMovement(delta);
    this.applyRotation(delta, bigDelta);

    // this.applyThrust(delta);

    // if (this.currentThrottle)
    // spacetimeControl.add()
  }
}
