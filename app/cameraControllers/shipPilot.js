import * as THREE from "three";

import { controls } from '../local/controls';
import core from "../local/core";
import speedTracker from './utils/speedTracker';
import { lockModes } from '../local/PointerLockControls';
import AssetLoader from '../local/AssetLoader';

const mode = core.modes.shipPilot;
const camControls = controls.shipPilot;
let speedTimer = null;

let modeActive = false;

// 195=1c, 199=1.5c, 202=2c, 206=3c, 209=4c.
// The idea is that the player can push this number up infinitely, but with
// huge falloff past 206 because every extra 0.1 eventually scales to 1c
// faster. 195 is junk, 199 is beginner. 206 is end-game. 209 is something
// achievable only through insane grind.
let maxSpeed = 202;
// 195=1c, 199=1.5c, 202=2c, 206=3c, 209=4c.
let currentSpeed = 0;
// Throttle. 0-100.
let currentThrottle = 0;
// 0-100 - lags behind real throttle, and struggles at higher numbers.
let actualThrottle = 0;
// Instantly pushes warp speed to max, bypassing acceleration and gravitational
// drag.
let debugFullWarpSpeed = false;
// Hyperdrive rotation speed. TODO: rename to correct technical terms.
const rotationSpeed = 0.00005;
// When pressing A and D. TODO: rename to correct technical terms.
const spinSpeed = 0.01;
// Used to ease in/out of spinning.
let spinBuildup = 0;

// Same top speed as WARP_EXPONENTIAL, but acceleration is constant.
// Reaches 0.1c at 2% power with strongest engine (4c max).
const WARP_LINEAR = 1;
// Same top speed as WARP_LINEAR, but acceleration is very slow below 90%
// engine power. Acceleration blows up very quickly past 95%.
// Reaches 0.1c at 80% power with strongest engine (4c max).
const WARP_EXPONENTIAL = 2;

// Honestly unsure which one to use, so offering both to devs at the moment.
// Note that the top speed for all engine types is the same. Something to
// consider: we'll have gravity to hurt our acceleration, so exponential might
// be annoyingly slow when inside a solar system.
const engineType = WARP_LINEAR;

// Just to alleviate some confusion: 1 means 'nothing', less then 1 is negative
// ambient energy. In other words, this number should always be 1 or more. It
// gets exponentially higher as you get closer to a planet/star/whatever.
let ambientGravity = 1;
let maxThrottle = 100;

const ctrl = {
  thrustInc: false,
  thrustDec: false,
  thrustReset: false,
  //
  turnLeft: false,
  turnRight: false,
  lookUp: false,
  lookDown: false,
  spinLeft: false,
  spinRight: false,
}

const toggles = {
  // TODO: think about whether or not this belongs in core instead.
  // toggleMouseSteering: () => $game.ptrLockControls.toggleCamLock(),
  toggleMouseSteering: () => {
    const ptr = $game.ptrLockControls;
    // core.coreKeyToggles.toggleMouseSteering();
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
    steer.upDown = 0;
    steer.leftRight = 0;
  },
  hyperdrive: core.coreKeyToggles.toggleHyperMovement,
  // TODO: remove me
  _debugGravity: () => { if (ambientGravity === 10) { ambientGravity = 1; }  else { ambientGravity = 10; } },
  debugFullWarpSpeed: () => { debugFullWarpSpeed = !debugFullWarpSpeed; }
};

const steer = {
  // TODO: get the proper technical terms for this.
  upDown: 0,
  leftRight: 0,
}

function register() {
  core.registerCamControl({
    name: 'shipPilot', render, triggerAction,
  });

  core.registerKeyPress({ mode, cb: onKeyPress });
  core.registerKeyUpDown({ mode, cb: onKeyUpDown });
  core.registerAnalogListener({ mode, cb: onAnalogInput });

  // Only render if mode is shipPilot.
  core.modeListeners.register((change) => {

    modeActive = change.mode === mode;
    if (modeActive) {
      // Set game lock only when the game is ready.
      core.onLoadProgress(core.progressActions.gameViewReady, () => {
        $game.ptrLockControls.setLockMode(lockModes.headLook);
      });
      core.onLoadProgress(core.progressActions.playerShipLoaded, () => {
        // TODO: move this into the level loader. It needs to be dynamic based on
        //  the level itself (in this case we attach the player to the main cam).
        $game.playerShip.cameras[0].attach($game.camera);
        // $game.playerShip.scene.children[2].attach($game.camera);
        $game.camera.position.x = 0;
        $game.camera.position.y = 0;
        $game.camera.position.z = 0;
      });
      speedTimer = speedTracker.trackCameraSpeed();
    }
    else {
      if (speedTimer) {
        speedTracker.clearSpeedTracker(speedTimer);
      }
    }
  });

  core.playerShipReadyListeners.register(onShipLoaded);
}

function onShipLoaded(mesh) {
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
}

// Snap camera to local frame of reference. Not really needed for ship pilot as we're doing this anyway.
// Needed for walking around the ship in peace.
// TODO: is this still needed?
function snapCamToLocal() {
  // keep a vector of your local coords.
  // snap a tmp vector to ship origin.
  // snap your cam to a position relative to the difference of local and tmp.
}

function onKeyPress({ key, amount }) {
  console.log('[shipPilot 1] key press:', key, '->', camControls[key]);

  const control = camControls[key];
  if (!control) {
    // No control mapped for pressed button.
    return;
  }
  // This below should possibly be checked inside the render function, but it
  // feels complicated and wasteful doing so..

  // Ex. 'toggleMouseSteering' or 'toggleMousePointer' etc.
  const toggleFn = toggles[control];
  if (toggleFn) {
    toggleFn();
  }
}

function onKeyUpDown({ key, amount, isDown }) {
  console.log('[shipPilot 2] key:', key, '->', camControls[key], isDown ? '(down)' : '(up)');

  const control = camControls[key];
  if (!control) {
    // No control mapped for pressed button.
    return;
  }
  ctrl[control] = isDown;
}

function onAnalogInput(key, delta, invDelta, gravDelta, gravInvDelta) {
  if (key === 'spNorth' || key === 'spSouth') {
    // console.log(`[shipPilot] analog:, ${key}, d=${delta}, ~d=${invDelta}, gd=${gravDelta}, ~gd${gravInvDelta}`);
    steer.upDown = maxN(steer.upDown + gravDelta, 200);
  }
  if (key === 'spEast' || key === 'spWest') {
    steer.leftRight = maxN(steer.leftRight + (gravDelta * -1), 200);
  }
}

function triggerAction(action) {
  if (modeActive) {
    const fn = toggles[action];
    if (fn) {
      fn();
    }
  }
}

/**
 * Changes the throttle by the specified percentage.
 * @param {number} amount - Decimal percentage.
 */
function changeThrottle(delta, amount) {
  let change = (maxThrottle * amount) * (delta * 60);
  return change;
}

/**
 * Used to slow the throttle needle following the player's request.
 * TODO: actually working! remove this message before commit.
 */
function dampenTorque(delta, value, target, growthSpeed) {
  // console.log(`value=${value}, target=${target}, growthSpeed=${growthSpeed}`)
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
function dampenByFactor(delta, value, target) {
  let result = 0;
  // Do not use delta here - it's applied in dampenTorque.
  const warpFactor = 4; // equivalent to delta [at 0.016] * 250 growth.
  if (target > value) {
    const ratio = -((actualThrottle / (maxThrottle / ambientGravity)) - 1);
    result = dampenTorque(delta, value, target, ratio * warpFactor);
  }
  else {
    // Allow fast deceleration.
    result = dampenTorque(delta, value, target, warpFactor**2);
  }

  if (result < 0) {
    return 0;
  }
  return result;
}

/**
 * Blows meters per second into ligh years per second for fun and profit.
 * @param amount
 */
function scaleHyperSpeed(amount) {
  return Math.exp(amount / 10);
}

function handleHyper(delta, scene, playerShip, warpBubble) {
  if (steer.leftRight) {
    const lr = (steer.leftRight * delta) * 65.2;
    warpBubble.rotateY(lr * rotationSpeed);
  }
  if (steer.upDown) {
    const ud = (steer.upDown * delta) * 65.2;
    warpBubble.rotateX(ud * rotationSpeed);
  }

  const effectiveSpin = (spinSpeed * delta) * 65.2;
  if (ctrl.left_renameme) {
    spinBuildup -= effectiveSpin;
    if (spinBuildup < -effectiveSpin) {
      spinBuildup = -effectiveSpin;
    }
  }
  if (ctrl.right_renameme) {
    spinBuildup += effectiveSpin;
    if (spinBuildup > effectiveSpin) {
      spinBuildup = effectiveSpin;
    }
  }
  warpBubble.rotateZ(spinBuildup);
  if (Math.abs(spinBuildup) < 0.0001) {
    spinBuildup = 0;
  }
  else {
    spinBuildup /= 1 + (10 * delta);
  }

  if (ctrl.thrustInc) {
    currentThrottle += changeThrottle(delta, 0.01);
    if (currentThrottle > maxThrottle) {
      currentThrottle = maxThrottle;
    }
  }
  if (ctrl.thrustDec) {
    currentThrottle += changeThrottle(delta, -0.01);
    if (currentThrottle < 0) {
      currentThrottle = 0;
    }
  }
  // Can't reverse when in a warp field.
  if (currentThrottle < 0) currentThrottle = 0;
  if (ctrl.thrustReset) currentThrottle = 0;

  const throttle = (currentThrottle / maxThrottle) * 100;

  actualThrottle = dampenByFactor(delta, actualThrottle, throttle);
  if (actualThrottle > maxThrottle - 0.01) {
    // This helps prevent a bug where the throttle can sometimes get stuck at
    // more than 100%; when this happens, throttling down does nothing and
    // gravity increases acceleration.
    actualThrottle = throttle - 0.01;
  }

  if (debugFullWarpSpeed) {
    actualThrottle = maxThrottle;
  }

  currentSpeed = (actualThrottle / 100) * maxSpeed;

  let hyperSpeed;
  if (engineType === WARP_LINEAR) {
    const maxHyper = scaleHyperSpeed(maxSpeed);
    hyperSpeed = (actualThrottle / 100) * maxHyper;
  }
  else if (engineType === WARP_EXPONENTIAL) {
    hyperSpeed = scaleHyperSpeed(currentSpeed);
  }
  else {
    // Very slow, reduces speed to meters per second.
    hyperSpeed = currentSpeed;
  }

  hyperSpeed *= delta;

  // Move the world around the ship.
  let direction = new THREE.Vector3();
  playerShip.cameras[0].getWorldDirection(direction);
  scene.position.addScaledVector(direction, -hyperSpeed);
  warpBubble.position.addScaledVector(direction, hyperSpeed);
}

/** Returns the number, or 100 (sign preserved) if it's more than 100. */
function max100(amount) {
  if (amount > 100) return 100;
  else if (amount < -100) return -100;
  else return amount;
}

/** Returns the number, or 100 (sign preserved) if it's more than 100. */
function maxN(amount, max) {
  if (amount > max) return max;
  else if (amount < -max) return -max;
  else return amount;
}

function handleLocal(delta) {
  // TODO: implement me.
}

let updateCount_DELETEME = 0;
function render(delta) {
  const { playerShip, playerShipBubble } = $game;
  if (!playerShip) {
    return;
  }
  // TODO: check if we ever need to uncomment this. If render turns out to
  //  necessary for controls, we should probably have checks for specifically
  //  this when applying the effects of controls.
  // if (!modeActive) {
  //   return;
  // }

  // update debug ui
  const div = document.getElementById('hyperdrive-stats');
  if (div) {
    const throttle = Math.round((currentThrottle / maxThrottle) * 100);
    // |
    div.innerText = `
      y: ${throttle}%
      u/d=${steer.upDown}, l/r=${steer.leftRight}
      Player throttle: ${throttle}% (${Math.round(currentThrottle)}/${maxThrottle})
      Actual throttle: ${actualThrottle.toFixed(1)}
      Microgravity: ${(((10**-(1/ambientGravity))-0.1)*10).toFixed(2)}G [factor ${ambientGravity}]
    `;
  }

  const { scene, camera, renderer, hyperMovement } = $game;

  // TODO: make it so that you cannot hop into hyperdrive without first
  //  speeding up, but once you're in hyperdrive you can actually float with
  //  zero speed. Although, create some form of a drawback.
  if (hyperMovement) {
    // Hyper-movement is similar to freecam, but has a concept of inertia. The
    // ship cannot strafe in this mode. The ship should have no physics in this
    // mode, and the universe moves instead of the ship.
    handleHyper(delta, scene, playerShip, playerShipBubble);
  }
  else {
    // PLEASE GIVE ME PHYSICS
    handleLocal(delta);
  }
}

export default {
  name: 'shipPilot',
  register,
}
