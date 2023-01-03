import { Object3D, Vector3 } from 'three';
import { WarpEngineType } from './WarpEngineType';
import { gameRuntime } from '../../../../gameRuntime';
import { Location } from '../../../Location';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';

// TODO: Refactor this into the Location module.
// Just to alleviate some confusion: 1 means 'nothing', less then 1 is negative
// ambient energy. In other words, this number should always be 1 or more. It
// gets exponentially higher as you get closer to a planet/star/whatever.
const ambientGravity = 1;

// FIXME: move into utils if we end up still needing this.
// Acts like Math.max if amount positive, or Math.min if amount is negative.
function signRelativeMax(amount, max) {
  if (amount > max) return max;
  else if (amount < -max) return -max;
  else return amount;
}

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

  private _cachedLocation: Location;
  private _cachedShipPilot: ShipPilot;

  constructor() {
    this.maxSpeed = 209;
    this.currentSpeed = 0;
    this.currentThrottle = 0;
    this.actualThrottle = 0;
    this.debugFullWarpSpeed = false;
    this.pitchAndYawSpeed = 0.00005;
    this.rollSpeed = 1;
    this.rollBuildup = 0;
    this.yawBuildup = 0;
    this.pitchBuildup = 0;
    this.flightAssist = true;
    this.engineType = WarpEngineType.linearAcceleration;
    this.maxThrottle = 100;

    this._cachedLocation = gameRuntime.tracked.location.cachedValue;
    this._cachedShipPilot = gameRuntime.tracked.shipPilot.cachedValue;
    this._setupWatchers();
  }

  _setupWatchers() {
    gameRuntime.tracked.location.getEveryChange((location) => {
      this._cachedLocation = location;
    });
    gameRuntime.tracked.shipPilot.getEveryChange((shipPilot) => {
      this._cachedShipPilot = shipPilot;
    });
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
  easeIntoBuildup(delta, buildup, target, rollSpeed, factor) {
    rollSpeed *= delta;
    const total = (target + buildup) * factor * delta;

    if (Math.abs(total) > rollSpeed) {
      return rollSpeed * Math.sign(total);
    }

    return total;
  }

  easeOutOfBuildup(delta, rollBuildup, easeFactor) {
    if (Math.abs(rollBuildup) < delta * 0.1) {
      rollBuildup = 0;
    }
    else {
      rollBuildup /= 1 + (easeFactor * delta);
    }

    return rollBuildup;
  }

  applyRotation(delta) {
    const {
      pitchDown, pitchUp, rollLeft, rollRight, yawLeft, yawRight
    } = this._cachedShipPilot.state;

    const rotation = this._cachedLocation.universeRotationM;

    const yaw = yawLeft - yawRight;
    const pitch = pitchDown - pitchUp;
    const roll = rollLeft - rollRight;

    // if (yaw) {
    //   this.yawBuildup = this.easeIntoBuildup(delta, this.yawBuildup, yaw, this.pitchAndYawSpeed, 38);
    // }
    //
    // if (pitch) {
    //   this.pitchBuildup = this.easeIntoBuildup(delta, this.pitchBuildup, pitch, this.pitchAndYawSpeed, 38);
    // }

    if (roll) {
      this.rollBuildup = this.easeIntoBuildup(delta, this.rollBuildup, roll, this.rollSpeed, 100000);
    }

    rotation.rotateY(this.yawBuildup * this.pitchAndYawSpeed);
    rotation.rotateX(this.pitchBuildup * this.pitchAndYawSpeed);
    rotation.rotateZ(this.rollBuildup);

    if (this.flightAssist) {
      this.yawBuildup = this.easeOutOfBuildup(delta, this.yawBuildup, 10);
      this.pitchBuildup = this.easeOutOfBuildup(delta, this.pitchBuildup, 10);
      this.rollBuildup = this.easeOutOfBuildup(delta, this.rollBuildup, 10);
    }
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
