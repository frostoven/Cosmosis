import * as THREE from "three";

import core from "../local/core";
import speedTracker from './utils/speedTracker';
import { lockModes } from '../local/PointerLockControls';
import AssetLoader from '../local/AssetLoader';
import { startupEvent, getStartupEmitter } from '../emitters';
import contextualInput from '../local/contextualInput';

const { camController, ActionType } = contextualInput;
const shipPilotMode = camController.enroll('shipPilot');

const startupEmitter = getStartupEmitter();

let speedTimer = null;

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
// Hyperdrive rotation speed.
const pitchAndYawSpeed = 0.00005;
// When pressing A and D.
const rollSpeed = 0.01;
// Used to ease in/out of spinning.
let rollBuildup = 0;
// Used to ease in/out of spinning.
let yawBuildup = 0;
// Used to ease in/out of spinning.
let pitchBuildup = 0;
// If true, ship will automatically try to stop rotation when the thrusters
// aren't active.
let flightAssist = true;

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
  rollLeft: false,
  rollRight: false,
}

const toggles = {
  // TODO: think about whether or not this belongs in core instead.
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
    steer.upDown = 0;
    steer.leftRight = 0;
  },
  // engageHyperdrive: core.coreKeyToggles.toggleHyperMovement,
  engageHyperdrive: () => {
    $game.hyperMovement = !$game.hyperMovement;
    // updateHyperdriveDebugText(); // TODO: pass to uiEmitter.
    return $game.hyperMovement;
  },
  // TODO: remove me
  _debugGravity: () => { if (ambientGravity === 10) { ambientGravity = 1; }  else { ambientGravity = 10; } },
  debugFullWarpSpeed: () => { debugFullWarpSpeed = !debugFullWarpSpeed; },
  toggleFlightAssist: () => flightAssist = !flightAssist,
};

const steer = {
  // TODO: get the proper technical terms for this.
  upDown: 0,
  leftRight: 0,
}

function register() {
  core.registerRenderHook({
    name: 'shipPilot', render,
  });

  // Key down actions.
  camController.onActions({
    actionType: ActionType.keyUp | ActionType.keyDown,
    actionNames: Object.keys(ctrl), // all controls handled by shipPilot
    modeName: shipPilotMode,
    callback: onKeyUpOrDown,
  });

  // TODO: reimplement numpad.

  // Key press actions.
  camController.onActions({
    actionType: ActionType.keyPress,
    actionNames: Object.keys(toggles), // all presses handled by shipPilot
    modeName: shipPilotMode,
    callback: onKeyPress,
  });

  // Analog actions.
  camController.onActions({
    actionType: ActionType.analogMove,
    actionNames: [ 'pitchUp', 'pitchDown', 'yawLeft', 'yawRight' ],
    modeName: shipPilotMode,
    callback: onAnalogInput,
  });

  camController.onControlChange(({ next }) => {
    if (next === shipPilotMode) {
      console.log('-> mode changed to', shipPilotMode);
      // Set game lock only when the game is ready.
      startupEmitter.on(startupEvent.gameViewReady, () => {
        $game.ptrLockControls.setLockMode(lockModes.headLook);
      });

      startupEmitter.on(startupEvent.playerShipLoaded, () => {
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

  startupEmitter.on(startupEvent.playerShipLoaded, () => {
    onShipLoaded($game.playerShip);
  });
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

function onKeyPress({ action }) {
  // console.log('[shipPilot 1] key press:', action);
  // Ex. 'toggleMouseSteering' or 'toggleMousePointer' etc.
  const toggleFn = toggles[action];
  if (toggleFn) {
    toggleFn();
  }
}

function onKeyUpOrDown({ action, isDown }) {
  // console.log('[shipPilot 2] key:', action, '->', isDown ? '(down)' : '(up)');
  ctrl[action] = isDown;
}

function onAnalogInput({ action, analogData }) {
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
      steer.upDown = maxN(steer.upDown + deltaY, 200);
    }
    if (action === 'yawLeft' || action === 'yawRight') {
      steer.leftRight = maxN(steer.leftRight + (deltaX * -1), 200);
    }
  }
  else {
    const mouse = core.userMouseSpeed(deltaX, deltaY);
    $game.ptrLockControls.onMouseMove(mouse.x, mouse.y);
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
  let result;
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
 * Blows meters per second into light years per second for fun and profit.
 * @param amount
 */
function scaleHyperSpeed(amount) {
  return Math.exp(amount / 10);
}

/**
 * Function that eases into targets.
 */
function easeIntoBuildup(delta, buildup, rollSpeed, factor, direction) {
  buildup = Math.abs(buildup);

  const effectiveSpin = (rollSpeed * delta) * factor;
  buildup += effectiveSpin;
  if (buildup > effectiveSpin) {
    buildup = effectiveSpin;
  }

  return buildup * direction;
}

function easeOutOfBuildup(delta, rollBuildup, easeFactor) {
  if (Math.abs(rollBuildup) < 0.0001) {
    rollBuildup = 0;
  }
  else {
    rollBuildup /= 1 + (easeFactor * delta);
  }

  return rollBuildup;
}

function handleHyper(delta, scene, playerShip, warpBubble) {
  if (steer.leftRight) {
    // TODO: movement is changes sharply with sudden mouse changes. Investigate
    //  if this is what we really want (note we're in a warp bubble). Perhaps
    //  add momentum for a more natural feel.
    yawBuildup = easeIntoBuildup(delta, yawBuildup, steer.leftRight, 38, 1);
  }
  if (steer.upDown) {
    pitchBuildup = easeIntoBuildup(delta, pitchBuildup, steer.upDown, 38, 1);
  }

  if (ctrl.rollLeft && !ctrl.rollRight) {
    rollBuildup = easeIntoBuildup(delta, rollBuildup, rollSpeed, 65.2, -1);
  }
  if (ctrl.rollRight && !ctrl.rollLeft) {
    rollBuildup = easeIntoBuildup(delta, rollBuildup, rollSpeed, 65.2, 1);
  }

  warpBubble.rotateY(yawBuildup * pitchAndYawSpeed);
  warpBubble.rotateX(pitchBuildup * pitchAndYawSpeed);
  warpBubble.rotateZ(rollBuildup);

  if (flightAssist) {
    yawBuildup = easeOutOfBuildup(delta, yawBuildup, 10);
    pitchBuildup = easeOutOfBuildup(delta, pitchBuildup, 10);
    rollBuildup = easeOutOfBuildup(delta, rollBuildup, 10);
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
