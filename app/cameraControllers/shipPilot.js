import * as THREE from "three";

import { controls } from '../local/controls';
import core from "../local/core";
import speedTracker from "./utils/speedTracker";
import { lockModes } from "../local/PointerLockControls";

const mode = core.modes.shipPilot;
const camControls = controls.shipPilot;
let speedTimer = null;

let modeActive = false;

// 195=1c, 199=1.5c, 202=2c, 206=3c, 209=4c.
// The idea is that the player can push this number up infinitely, but with
// huge falloff past 206 because every extra 0.1 eventually scales to 1c
// faster. 195 is junk, 199 is beginner. 206 is end-game. 209 is something
// achievable only through insane grind.
let maxSpeed = 206;
// 195=1c, 199=1.5c, 202=2c, 206=3c, 209=4c.
let currentSpeed = 0;
// Throttle. 0-100.
let currentThrottle = 0;
// 0-100 - lags behind real throttle, and struggles at higher numbers.
let actualThrottle = 0;

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
  // toggleMouseSteering: () => $gameView.ptrLockControls.toggleCamLock(),
  toggleMouseSteering: () => {
    // core.coreKeyToggles.toggleMouseSteering();
    const curLock = $gameView.ptrLockControls.getLockMode();
    if (curLock === lockModes.headLook) {
      $gameView.ptrLockControls.setLockMode(lockModes.frozen);
      $gameView.ptrLockControls.showCrosshairs();
    }
    else {
      $gameView.ptrLockControls.setLockMode(lockModes.headLook);
      $gameView.ptrLockControls.hideCrosshairs();
    }
    // cycleAnalogMode();
  },
  hyperdrive: core.coreKeyToggles.toggleHyperMovement,
  // TODO: remove me
  debugGravity: () => { if (ambientGravity === 10) { ambientGravity = 1; }  else { ambientGravity = 10; } },
};

const steerModes = {
  steer: 'steer',
  look: 'look',
}

const analog = {
  steer: { x: 0, y: 0 },
  look: { x: 0, y: 0 },
};

let analogMode = steerModes.steer;
function cycleAnalogMode() {
  if (analogMode === steerModes.steer) {
    analogMode = steerModes.look;
  }
  else {
    analogMode = steerModes.steer;
  }
  analog.look.x = 0;
  analog.look.y = 0;
}

// TODO: DRY this, and add mouse sensitivity adjuster. IMPORTANT: separate
//  mouse look sensitivity from steer sensitivity.
const analogSteer = {
  spNorth: (d) => { const target = analog[analogMode]; target.y += d; if (target.y > 100) target.y = 100; },
  spSouth: (d) => { const target = analog[analogMode]; target.y += d; if (target.y < -100) target.y = -100;  },
  spEast: (d) => { const target = analog[analogMode]; target.x += d; if (target.x > 100) target.x = 100; },
  spWest: (d) => { const target = analog[analogMode]; target.x += d; if (target.x < -100) target.x = -100; },
};

// setInterval(() => {
//   console.log('lock mode:', $gameView.ptrLockControls.getLockMode());
// })

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
        $gameView.ptrLockControls.setLockMode(lockModes.freeLook);
      });

      // attachCamera($gameView.playerShip);
      speedTimer = speedTracker.trackCameraSpeed();
    }
    else {
      // detachCamera($gameView.playerShip);
      if (speedTimer) {
        speedTracker.clearSpeedTracker(speedTimer);
      }
    }
  });

  core.playerShipReadyListeners.register(onShipLoaded);
}

function onShipLoaded(mesh) {
  // console.log('shipPilot got mesh:', mesh);
  // attachCamera(mesh);
  // $gameView.camera.rotation.setFromVector3(new THREE.Vector3(-3.1, 0.03, 3.13));
  const vec = mesh.cameras[0].rotation.clone();
  // Camera direction in Blender is weird; a level camera looking straight has
  // rotation 90,0,0.
  vec.x += 1.5708; // 90 degrees
  $gameView.camera.rotation.setFromVector3(vec);
}

// Snap camera to local frame of reference. Not really needed for ship pilot as we're doing this anyway.
// Needed for walking around the ship in peace.
// TODO: is this still needed?
function snapCamToLocal() {
  // keep a vector of your local coords.
  // snap a tmp vector to ship origin.
  // snap your cam to a position relative to the difference of local and tmp.
}

// TODO: test current code with both world and local transform.
function updateCamAttach(attachCamTo, copyPosTo) {
  const targetPos = new THREE.Vector3(0, 0, 0,);
  let position = new THREE.Vector3();
  let quaternion = new TtodHREE.Quaternion();
  let scale = new THREE.Vector3();

  attachCamTo.getWorldPosition(targetPos);
  copyPosTo.copy(targetPos);

  attachCamTo.matrixWorld.decompose(position, quaternion, scale);
  $gameView.ptrLockControls.setCamRefQuat(quaternion);
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
  // console.log('[shipPilot 2] key:', key, '->', camControls[key], isDown ? '(down)' : '(up)');

  const control = camControls[key];
  if (!control) {
    // No control mapped for pressed button.
    return;
  }
  ctrl[control] = isDown;
}

function onAnalogInput(key, delta, invDelta, gravDelta, gravInvDelta) {
  // console.log('[shipPilot] analog:', key, delta, invDelta, gravDelta, gravInvDelta);
  analogSteer[key](delta);
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
  // if (change + currentThrottle >= maxThrottle || change + currentThrottle <= -maxThrottle) {
  //   return 0;
  // }
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
  const warpFactor = 4; // 0.016 delta * 250 growth.
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

function handleHyper(delta, scene, playerShip) {
  // console.log('[handleHyper] delta:', delta);
  // TODO: make this whatever the ship considers to be 'forward'. We might
  //  define this as something such as camera[0]'s rotation, or the rotation of
  //  an object with a specific name.
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

  // Move the world around the ship.
  scene.translateZ(delta * hyperSpeed);
  playerShip.scene.translateZ(delta * -hyperSpeed);

  // bookm
  // Steering.
  const rotX = max100(analog.steer.x);
  const rotY = max100(analog.steer.y);
}

/** Returns the number, or 100 (sign preserved) if it's more than 100. */
function max100(amount) {
  if (amount > 100) return 100;
  else if (amount < -100) return -100;
  else return amount;
}

function handleLocal(delta) {
  // TODO: implement me.
}

let updateCount_DELETEME = 0;
function render(delta) {
  // console.log(steer); // analogSteer

  const { playerShip } = $gameView;
  if (!playerShip) {
    return;
  }
  // TODO: implement ship controls.

  if (!modeActive) {
    return;
  }

  // update debug ui
  const div = document.getElementById('hyperdrive-stats');
  if (div) {
    const throttle = Math.round((currentThrottle / maxThrottle) * 100);
    // |
    div.innerText = `
      y: ${throttle}% (${analog.steer.y})
      Player throttle: ${throttle}% (${Math.round(currentThrottle)}/${maxThrottle})
      Actual throttle: ${actualThrottle.toFixed(1)}
      Microgravity: ${(((10**-(1/ambientGravity))-0.1)*10).toFixed(2)}G [factor ${ambientGravity}]
    `;
  }

  const { scene, camera, renderer, hyperMovement } = $gameView;

  // TODO: make it so that you cannot hop into hyperdrive without first
  //  speeding up, but once you're in hyperdrive you can actually float with
  //  zero speed. Although, create some form of a drawback.
  if (hyperMovement) {
    // Hyper-movement is similar to freecam, but has a concept of inertia. The
    // ship cannot strafe in this mode. The ship should have no physics in this
    // mode, and the universe moves instead of the ship.
    handleHyper(delta, scene, playerShip);
  }
  else {
    // PLEASE GIVE ME PHYSICS
    handleLocal(delta);
  }

  // Note: always put this after ship position modifications or the camera will
  // lag a frame behind and appear extremely glitchy.
  updateCamAttach(playerShip.cameras[0], camera.position);
}

export default {
  name: 'shipPilot',
  register,
}
