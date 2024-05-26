import { Object3D, Vector3 } from 'three';
import { WarpEngineType } from './WarpEngineType';
import { gameRuntime } from '../../../../gameRuntime';
import { SpacetimeControl } from '../../../SpacetimeControl';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';
import { lerpToZero, signRelativeMax } from '../../../../../local/mathUtils';

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
  public pitchAndYawSpeed: number;
  // When pressing A and D.
  public rollSpeed: number;
  // Used to ease in/out of spinning.
  public rollBuildup: number;
  // Used to ease in/out of spinning.
  public yawBuildup: number;
  // Used to ease in/out of spinning.
  public pitchBuildup: number;
  // If true, ship will automatically try to stop rotation when the thrusters
  // aren't active.
  public flightAssist: boolean;
  // Honestly unsure which one to use, so offering both to devs at the moment.
  // Note that the top speed for all engine types is the same. Something to
  // consider: we'll have gravity to hurt our acceleration, so exponential might
  // be annoyingly slow when inside a solar system.
  public engineType: WarpEngineType;
  public maxThrottle: number;

  private _cachedLocation: SpacetimeControl;
  private _cachedShipPilot: ShipPilot;

  constructor() {
    this.maxSpeed = 209;
    this.currentSpeed = 0;
    this.currentThrottle = 0;
    this.actualThrottle = 0;
    this.debugFullWarpSpeed = false;
    this.pitchAndYawSpeed = 0.005;
    this.rollSpeed = 0.01;
    this.rollBuildup = 0;
    this.yawBuildup = 0;
    this.pitchBuildup = 0;
    this.flightAssist = true;
    this.engineType = WarpEngineType.linearAcceleration;
    this.maxThrottle = 100;

    this._cachedLocation = gameRuntime.tracked.spacetimeControl.cachedValue;
    this._cachedShipPilot = gameRuntime.tracked.shipPilot.cachedValue;
    this._setupWatchers();
  }

  _setupWatchers() {
    gameRuntime.tracked.spacetimeControl.getEveryChange((location) => {
      this._cachedLocation = location;
    });
    gameRuntime.tracked.shipPilot.getEveryChange((shipPilot) => {
      this._cachedShipPilot = shipPilot;
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
  changeThrottle(delta, amount) {
    return (this.maxThrottle * amount) * (delta * 60);
  }


  /**
   * Used to slow the throttle needle following the player's request.
   */
  dampenTorque(delta, value, target, growthSpeed) {
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
  dampenByFactor(delta, value, target) {
    let result;
    // Do not use delta here - it's applied in dampenTorque.
    const warpFactor = 4; // equivalent to delta [at 0.016] * 250 growth.
    if (target > value) {
      const ratio = -((this.actualThrottle / (this.maxThrottle / ambientGravity)) - 1);
      result = this.dampenTorque(delta, value, target, ratio * warpFactor);
    }
    else {
      // Allow fast deceleration.
      result = this.dampenTorque(delta, value, target, warpFactor**2);
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

  easeOutOfBuildup(delta, rollBuildup, easeFactor) {
    if (Math.abs(rollBuildup) < delta * 0.1) {
      rollBuildup = 0;
    }
    else {
      rollBuildup /= 1 + (easeFactor * delta);
    }

    return rollBuildup;
  }

  easeIntoBuildup(delta, currentValue, requestedValue, maxAllowed, acceleration=1) {
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

  quadEaseOut(time, startValue, change, duration) {
    time /= duration / 2;
    if (time < 1)  {
      return change / 2 * time * time + startValue;
    }

    time--;
    return -change / 2 * (time * (time - 2) - 1) + startValue;
  };

  lerp (t, b, c, d) {
    return c*t/d + b;
  }

  applyRotation(delta) {
    const state = this._cachedShipPilot.state;

    const {
      pitchDown, pitchUp, rollLeft, rollRight, yawLeft, yawRight
    } = this._cachedShipPilot.state;

    const rotation = this._cachedLocation.universeRotationM;

    // const yaw = yawLeft + yawRight;
    // const pitch = pitchUp - pitchDown;
    // const roll = rollLeft - rollRight;


    // ---------------
    let yaw = (state.yawLeft + state.yawRight) * 0.00001;
    let pitch = (state.pitchUp + state.pitchDown) * 0.00001;
    let roll = (state.rollLeft + state.rollRight) * 0.0001;

    // if (yaw) {
    //
    // }

    // this.rollBuildup = this.easeIntoBuildup(delta, this.rollBuildup, roll, this.rollSpeed, 0.01);
    // this.rollBuildup = this.lerp();

    // console.log({roll, rollBuildup: this.rollBuildup });

    // state.yawRight = yaw;
    // state.yawLeft = -yaw;
    // ---------------
    rotation.rotateY(signRelativeMax(-yaw, this.pitchAndYawSpeed));
    rotation.rotateX(signRelativeMax(-pitch, this.pitchAndYawSpeed));
    rotation.rotateZ(this.rollBuildup);
    // ---------------



    // console.log('172 ->', { yaw, pitch, roll });
    // console.log('172 ->', { yaw });

    // if (yaw) {
    //   this.yawBuildup = this.easeIntoBuildup(delta, this.yawBuildup, -yaw, this.pitchAndYawSpeed);
    // }

    // console.log('yawBuildup:', this.yawBuildup);

    // if (pitch) {
    //   this.pitchBuildup = this.easeIntoBuildup(delta, this.pitchBuildup, pitch, this.pitchAndYawSpeed);
    // }

    // if (roll) {
    //   this.rollBuildup = this.easeIntoBuildup(delta, this.rollBuildup, roll, this.rollSpeed);
    // }

    // rotation.rotateY(this.yawBuildup);
    // rotation.rotateX(this.pitchBuildup);
    // rotation.rotateZ(this.rollBuildup);
    //
    // if (this.flightAssist) {
    //   yaw = this.easeOutOfBuildup(delta, yaw, 10);
    //   // this.pitchBuildup = this.easeOutOfBuildup(delta, this.pitchBuildup, 10);
    //   this.rollBuildup = this.easeOutOfBuildup(delta, this.rollBuildup, 10);
    // }
  }

  // FIXME: update me to work with new plugin system.
  stepWarp(delta) {
    if (!this._cachedShipPilot) {
      return;
    }

    this.applyRotation(delta);
    // this.applyThrust(delta);
  }
}
