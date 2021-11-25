import * as THREE from "three";

// TODO: consider renaming this to shipControl. This module does 2 things:
//  * Takes space ship input when sitting in the pilot's seat.
//  * Processes ship warp physics.
//  Might need to separate that last one into level control.
import core from "../../local/core";
import speedTracker from '../../local/speedTracker';
import { lockModes } from '../../local/PointerLockControls';
import AssetLoader from '../../local/AssetLoader';
import { getStartupEmitter, startupEvent } from '../../emitters';
import contextualInput from '../../local/contextualInput';

const { camController, ActionType } = contextualInput;
const shipPilotMode = camController.enroll('shipPilot');

const startupEmitter = getStartupEmitter();

let speedTimer = null;

// Same top speed as WARP_EXPONENTIAL, but acceleration is constant.
// Reaches 0.1c at 2% power with strongest engine (4c max).
const WARP_LINEAR = 1;
// Same top speed as WARP_LINEAR, but acceleration is very slow below 90%
// engine power. Acceleration blows up very quickly past 95%.
// Reaches 0.1c at 80% power with strongest engine (4c max).
const WARP_EXPONENTIAL = 2;

// TODO: add vec3s to the instance.

function ShipPilot(options={}) {
  this.modeName = shipPilotMode;
  this.setDefaultValues();
  this.initNavigationValues();
  this.setControlActions();

  startupEmitter.on(startupEvent.playerShipLoaded, () => {
    this.onShipLoaded(this.playerShip);
  });

  // Apply any overrides specified.
  for (const property in options) {
    if (options.hasOwnProperty(property)) {
      this[property] = options[property];
      // ^^ Example of what this looks like to the computer:
      //      this['something'] = options['something'];
    }
  }
}

/**
 * Resets all values to default.
 */
ShipPilot.prototype.setDefaultValues = function applyDefaultValues() {
  this.spaceScene = null;
  this.levelScene = null;
  this.playerShip = null;
  this.playerWarpBubble = null;

  // 195=1c, 199=1.5c, 202=2c, 206=3c, 209=4c, 300=35600c (avoid going over 209).
  // The idea is that the player can push this number up infinitely, but with
  // huge falloff past 206 because every extra 0.1 eventually scales to 1c
  // faster. 195 is junk, 199 is beginner. 206 is end-game. 209 is something
  // achievable only through insane grind.
  this.maxSpeed = 202;
  // 195=1c, 199=1.5c, 202=2c, 206=3c, 209=4c.
  this.currentSpeed = 0;
  // Throttle. 0-100.
  this.currentThrottle = 0;
  // 0-100 - lags behind real throttle, and struggles at higher numbers.
  this.actualThrottle = 0;
  // Instantly pushes warp speed to max, bypassing acceleration and gravitational
  // drag.
  this.debugFullWarpSpeed = false;
  // Hyperdrive rotation speed.
  this.pitchAndYawSpeed = 0.00005;
  // When pressing A and D.
  this.rollSpeed = 0.01;
  // Used to ease in/out of spinning.
  this.rollBuildup = 0;
  // Used to ease in/out of spinning.
  this.yawBuildup = 0;
  // Used to ease in/out of spinning.
  this.pitchBuildup = 0;
  // If true, ship will automatically try to stop rotation when the thrusters
  // aren't active.
  this.flightAssist = true;

  // Honestly unsure which one to use, so offering both to devs at the moment.
  // Note that the top speed for all engine types is the same. Something to
  // consider: we'll have gravity to hurt our acceleration, so exponential might
  // be annoyingly slow when inside a solar system.
  this.engineType = WARP_LINEAR;

  // Just to alleviate some confusion: 1 means 'nothing', less then 1 is negative
  // ambient energy. In other words, this number should always be 1 or more. It
  // gets exponentially higher as you get closer to a planet/star/whatever.
  this.ambientGravity = 1;
  this.maxThrottle = 100;
};

ShipPilot.prototype.initNavigationValues = function initNavigationValues() {
  // Keeps track of buttons being pressed.
  this.ctrl = {
    thrustInc: false,
    thrustDec: false,
    thrustReset: false,
    //
    turnLeft: false,
    turnRight: false,
    lookUp: false,
    lookDown: false,
    rollLeft: false,
    rollRight: false,
  };

  this.steer = {
    // TODO: get the proper technical terms for this.
    upDown: 0,
    leftRight: 0,
  };
};

ShipPilot.prototype.setControlActions = function setControlActions() {
  this.toggles = {
    // toggleMouseSteering: () => $game.ptrLockControls.toggleCamLock(),
    toggleMouseSteering: () => {
      const ptr = $game.ptrLockControls;
      const curLock = ptr.getLockMode();
      if (curLock === lockModes.headLook) {
        ptr.setLockMode(lockModes.frozen);
        AssetLoader.enableCrosshairs();
      }
      else {
        ptr.setLockMode(lockModes.headLook);
        AssetLoader.disableCrosshairs();
      }
      ptr.resetMouse();
      this.steer.upDown = 0;
      this.steer.leftRight = 0;
    },
    // engageHyperdrive: core.coreKeyToggles.toggleHyperMovement,
    engageHyperdrive: () => {
      $game.hyperMovement = !$game.hyperMovement;
      // updateHyperdriveDebugText(); // TODO: pass to uiEmitter.
      return $game.hyperMovement;
    },
    // TODO: remove me
    _debugGravity: () => { if (this.ambientGravity === 10) { this.ambientGravity = 1; }  else { this.ambientGravity = 10; } },
    debugFullWarpSpeed: () => { this.debugFullWarpSpeed = !this.debugFullWarpSpeed; },
    toggleFlightAssist: () => this.flightAssist = !this.flightAssist,
  };
};

ShipPilot.prototype.replaceKeyListeners = function replaceKeyListeners() {
  // Key down actions.
  camController.replaceActions({
    actionType: ActionType.keyUp | ActionType.keyDown,
    actionNames: Object.keys(this.ctrl), // all controls handled by shipPilot
    modeName: shipPilotMode,
    callback: (args) => this.onKeyUpOrDown(args),
  });

  // TODO: reimplement numpad.

  // Key press actions.
  camController.replaceActions({
    actionType: ActionType.keyPress,
    actionNames: Object.keys(this.toggles), // all presses handled by shipPilot
    modeName: shipPilotMode,
    callback: (args) => this.onKeyPress(args),
  });

  // Analog actions.
  camController.replaceActions({
    actionType: ActionType.analogMove,
    actionNames: [ 'pitchUp', 'pitchDown', 'yawLeft', 'yawRight' ],
    modeName: shipPilotMode,
    callback: (args) => this.onAnalogInput(args),
  });
};

ShipPilot.prototype.onControlChange = function shipPilotControlChange({ next, previous }) {
  if (next === shipPilotMode) {
    console.log('-> mode changed to', shipPilotMode);
    // Set game lock only when the game is ready.
    startupEmitter.on(startupEvent.gameViewReady, () => {
      $game.ptrLockControls.setLockMode(lockModes.headLook);
    });

    startupEmitter.on(startupEvent.playerShipLoaded, () => {
      // TODO: move this into the level loader. It needs to be dynamic based on
      //  the level itself (in this case we attach the player to the main cam).
      this.playerShip.cameras[0].attach($game.camera);
      // this.playerShip.scene.children[2].attach($game.camera);
      $game.camera.position.x = 0;
      $game.camera.position.y = 0;
      $game.camera.position.z = 0;
    });

    speedTimer = speedTracker.trackCameraSpeed();
  }
  else if (previous === shipPilotMode && speedTimer) {
    speedTracker.clearSpeedTracker(speedTimer);
  }
};

ShipPilot.prototype.onShipLoaded = function onShipLoaded(mesh) {
  // TODO: many changes have been made since this was implemented; check if the
  //  below still does anything at all.

  // console.log('shipPilot got mesh:', mesh);
  // attachCamera(mesh);
  // $game.camera.rotation.setFromVector3(new THREE.Vector3(-3.1, 0.03, 3.13));
  const vec = mesh.cameras[0].rotation.clone();
  // Camera direction in Blender is weird; a level camera looking straight has
  // rotation 90,0,0.
  vec.x += 1.5708; // 90 degrees
  $game.camera.rotation.setFromVector3(vec);
};

// Snap camera to local frame of reference. Not really needed for ship pilot as we're doing this anyway.
// Needed for walking around the ship in peace.
// TODO: is this still needed?
// function snapCamToLocal() {
//   // keep a vector of your local coords.
//   // snap a tmp vector to ship origin.
//   // snap your cam to a position relative to the difference of local and tmp.
// }

ShipPilot.prototype.onKeyPress = function onKeyPress({ action }) {
  console.log('[shipPilot 1] key press:', action);
  // Ex. 'toggleMouseSteering' or 'toggleMousePointer' etc.
  const toggleFn = this.toggles[action];
  if (toggleFn) {
    toggleFn();
  }
};

ShipPilot.prototype.onKeyUpOrDown = function onKeyUpOrDown({ action, isDown }) {
  // console.log('[shipPilot 2] key:', action, '->', isDown ? '(down)' : '(up)');
  this.ctrl[action] = isDown;
};

ShipPilot.prototype.onAnalogInput = function onAnalogInput({ action, analogData }) {
  const ptr = $game.ptrLockControls;
  if (!ptr || !ptr.isPointerLocked) {
    // Ptr can be null while game is still loading.
    return;
  }
  const deltaX = analogData.x.delta;
  const deltaY = analogData.y.delta;

  const currLock = ptr.getLockMode();
  if (currLock === lockModes.frozen) {
    // Note: frozen means the player's head is frozen, as in, use steering
    // stick instead of looking around.
    if (action === 'pitchUp' || action === 'pitchDown') {
      // console.log(`[shipPilot] analog:, ${action}, d=${delta}, ~d=${invDelta}, gd=${gravDelta}, ~gd${gravInvDelta}`);
      this.steer.upDown = maxN(this.steer.upDown + deltaY, 200);
    }
    if (action === 'yawLeft' || action === 'yawRight') {
      this.steer.leftRight = maxN(this.steer.leftRight + (deltaX * -1), 200);
    }
  }
  else {
    const mouse = core.userMouseSpeed(deltaX, deltaY);
    $game.ptrLockControls.onMouseMove(mouse.x, mouse.y);
  }
};

/**
 * Changes the throttle by the specified percentage.
 * @param delta
 * @param {number} amount - Decimal percentage.
 */
ShipPilot.prototype.changeThrottle = function changeThrottle(delta, amount) {
  return (this.maxThrottle * amount) * (delta * 60);
};

/**
 * Used to slow the throttle needle following the player's request.
 */
ShipPilot.prototype.dampenTorque = function dampenTorque(delta, value, target, growthSpeed) {
  // console.log(`value=${value}, target=${target}, growthSpeed=${growthSpeed}`)
  growthSpeed *= delta;
  if (value < target) {
    return value + growthSpeed;
  }
  else {
    return value - growthSpeed;
  }
};

/**
 * Used to slow the throttle needle more as it approaches 100% engine power.
 * Similar to dampenTorque, but here the growth speed is dynamic.
 */
ShipPilot.prototype.dampenByFactor = function dampenByFactor(delta, value, target) {
  let result;
  // Do not use delta here - it's applied in dampenTorque.
  const warpFactor = 4; // equivalent to delta [at 0.016] * 250 growth.
  if (target > value) {
    const ratio = -((this.actualThrottle / (this.maxThrottle / this.ambientGravity)) - 1);
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
};

/**
 * Blows meters per second into light years per second for fun and profit.
 * @param amount
 */
ShipPilot.prototype.scaleHyperSpeed = function scaleHyperSpeed(amount) {
  return Math.exp(amount / 10);
};

/**
 * Function that eases into targets.
 */
ShipPilot.prototype.easeIntoBuildup = function easeIntoBuildup(delta, buildup, rollSpeed, factor, direction) {
  buildup = Math.abs(buildup);

  const effectiveSpin = (rollSpeed * delta) * factor;
  buildup += effectiveSpin;
  if (buildup > effectiveSpin) {
    buildup = effectiveSpin;
  }

  return buildup * direction;
};

ShipPilot.prototype.easeOutOfBuildup = function easeOutOfBuildup(delta, rollBuildup, easeFactor) {
  if (Math.abs(rollBuildup) < 0.0001) {
    rollBuildup = 0;
  }
  else {
    rollBuildup /= 1 + (easeFactor * delta);
  }

  return rollBuildup;
};

ShipPilot.prototype.handleHyper = function handleHyper(delta) {
  if (this.steer.leftRight) {
    // TODO: movement is changes sharply with sudden mouse changes. Investigate
    //  if this is what we really want (note we're in a warp bubble). Perhaps
    //  add momentum for a more natural feel.
    this.yawBuildup = this.easeIntoBuildup(delta, this.yawBuildup, this.steer.leftRight, 38, 1);
  }
  if (this.steer.upDown) {
    this.pitchBuildup = this.easeIntoBuildup(delta, this.pitchBuildup, this.steer.upDown, 38, 1);
  }

  if (this.ctrl.rollLeft && !this.ctrl.rollRight) {
    this.rollBuildup = this.easeIntoBuildup(delta, this.rollBuildup, this.rollSpeed, 65.2, -1);
  }
  if (this.ctrl.rollRight && !this.ctrl.rollLeft) {
    this.rollBuildup = this.easeIntoBuildup(delta, this.rollBuildup, this.rollSpeed, 65.2, 1);
  }

  this.playerWarpBubble.rotateY(this.yawBuildup * this.pitchAndYawSpeed);
  this.playerWarpBubble.rotateX(this.pitchBuildup * this.pitchAndYawSpeed);
  this.playerWarpBubble.rotateZ(this.rollBuildup);

  if (this.flightAssist) {
    this.yawBuildup = this.easeOutOfBuildup(delta, this.yawBuildup, 10);
    this.pitchBuildup = this.easeOutOfBuildup(delta, this.pitchBuildup, 10);
    this.rollBuildup = this.easeOutOfBuildup(delta, this.rollBuildup, 10);
  }

  if (this.ctrl.thrustInc) {
    this.currentThrottle += this.changeThrottle(delta, 0.01);
    if (this.currentThrottle > this.maxThrottle) {
      this.currentThrottle = this.maxThrottle;
    }
  }
  if (this.ctrl.thrustDec) {
    this.currentThrottle += this.changeThrottle(delta, -0.01);
    if (this.currentThrottle < 0) {
      this.currentThrottle = 0;
    }
  }
  // Can't reverse when in a warp field.
  if (this.currentThrottle < 0) this.currentThrottle = 0;
  if (this.ctrl.thrustReset) this.currentThrottle = 0;

  const throttle = (this.currentThrottle / this.maxThrottle) * 100;

  this.actualThrottle = this.dampenByFactor(delta, this.actualThrottle, throttle);
  if (this.actualThrottle > this.maxThrottle - 0.01) {
    // This helps prevent a bug where the throttle can sometimes get stuck at
    // more than 100%; when this happens, throttling down does nothing and
    // gravity increases acceleration.
    this.actualThrottle = throttle - 0.01;
  }

  if (this.debugFullWarpSpeed) {
    this.actualThrottle = this.maxThrottle;
  }

  this.currentSpeed = (this.actualThrottle / 100) * this.maxSpeed;

  let hyperSpeed;
  if (this.engineType === WARP_LINEAR) {
    const maxHyper = this.scaleHyperSpeed(this.maxSpeed);
    hyperSpeed = (this.actualThrottle / 100) * maxHyper;
  }
  else if (this.engineType === WARP_EXPONENTIAL) {
    hyperSpeed = this.scaleHyperSpeed(this.currentSpeed);
  }
  else {
    // Very slow, reduces speed to meters per second.
    hyperSpeed = this.currentSpeed;
  }

  hyperSpeed *= delta * 1000;

  // Move the world around the ship.
  let direction = new THREE.Vector3();
  this.playerShip.cameras[0].getWorldDirection(direction);
  this.spaceScene.position.addScaledVector(direction, -hyperSpeed);
  this.levelScene.position.addScaledVector(direction, -hyperSpeed);
  this.playerWarpBubble.position.addScaledVector(direction, hyperSpeed);
};

// // TODO: move to math utils.
// /** Returns the number, or 100 (sign preserved) if it's more than 100. */
// function max100(amount) {
//   if (amount > 100) return 100;
//   else if (amount < -100) return -100;
//   else return amount;
// }

// TODO: move to match utils.
/** Returns the number, or 100 (sign preserved) if it's more than 100. */
function maxN(amount, max) {
  if (amount > max) return max;
  else if (amount < -max) return -max;
  else return amount;
}

ShipPilot.prototype.handleLocal = function handleLocal(delta) {
  // TODO: implement me.
  //  Note: this meant to be used within the context of 'local space' as
  //  apposed to 'warp space'. Need to investigate if this is still needed.
};

ShipPilot.prototype.step = function step({ delta }) {
  // TODO: check if we ever need to uncomment this. If render turns out to
  //  necessary for controls, we should probably have checks for specifically
  //  this when applying the effects of controls.
  // if (!modeActive) {
  //   return;
  // }

  // update debug ui
  const div = document.getElementById('hyperdrive-stats');
  if (div) {
    const throttle = Math.round((this.currentThrottle / this.maxThrottle) * 100);
    // |
    div.innerText = `
      y: ${throttle}%
      u/d=${this.steer.upDown}, l/r=${this.steer.leftRight}
      Player throttle: ${throttle}% (${Math.round(this.currentThrottle)}/${this.maxThrottle})
      Actual throttle: ${this.actualThrottle.toFixed(1)}
      Microgravity: ${(((10**-(1/this.ambientGravity))-0.1)*10).toFixed(2)}G [factor ${this.ambientGravity}]
    `;
  }

  // TODO: expose this as an options or profile thing.
  const { hyperMovement } = $game;

  // TODO: make it so that you cannot hop into hyperdrive without first
  //  speeding up, but once you're in hyperdrive you can actually float with
  //  zero speed. Although, create some form of a drawback.
  if (hyperMovement) {
    // Hyper-movement is similar to freeCam, but has a concept of inertia. The
    // ship cannot strafe in this mode. The ship should have no physics in this
    // mode, and the universe moves instead of the ship.
    this.handleHyper(delta);
  }
  else {
    // TODO: PLEASE GIVE ME PHYSICS
    this.handleLocal(delta);
  }
};

export {
  ShipPilot,
  WARP_EXPONENTIAL,
  WARP_LINEAR,
}
