import * as THREE from "three";

import { controls } from '../local/controls';
import core from "../local/core";
import speedTracker from "./utils/speedTracker";

const mode = core.modes.shipPilot;
const camControls = controls.shipPilot;
let speedTimer = null;

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let speed = 120 / 14.388; // 120KM/h
// let speed = 25e6 / 14.388;

let modeActive = false;
// If true, the mouse is used to look around the ship. If false, it's used for
// ship controls.
let lookMode = false;

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

// const flags = {
//   // Only checked if toggleMousePointer===true. If free look is true, moving
//   // the mouse moves the camera. If free look is false, moving the mouse acts
//   // as like analog controller.
//   mouseControlEnabled: false,
//   // If true, the mouse pointer is not visible.
//   mousePointerEnabled: false,
// }
const toggles = {
  toggleMouseControl: () => $gameView.ptrLockControls.toggleCamLock(),
  toggleMousePointer: () => $gameView.ptrLockControls.toggle(),
};

function register() {
  core.registerCamControl({
    name: 'shipPilot', render,
  });

  core.registerKeyPress({
    mode, cb: onKeyPress,
  })

  core.registerKeyUpDown({
    mode, cb: onKeyUpDown,
  });

  core.registerAnalogListener({
    mode, cb: onAnalogInput,
  });

  // Only render if mode is shipPilot.
  core.modeListeners.register((change) => {
    console.log('==> shipPilot registerModeListener activated.');
    modeActive = change.mode === mode;
    if (modeActive) {
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
  console.log('shipPilot got mesh:', mesh);
  // attachCamera(mesh);
  $gameView.camera.rotation.setFromVector3(new THREE.Vector3(-3.1, 0.03, 3.13));
}

// function attachCamera(mesh) {
//     if (!mesh) {
//         return;
//     }
//     $gameView.attachCamTo = mesh.cameras[0];
//     $gameView.camera.rotation.setFromVector3(new THREE.Vector3(-3.1, 0.03, 3.13));
// }
//
// function detachCamera(mesh) {
//     // TODO: this may need to become a little smarter if we allow more modes to
//     //  force cam attachment.
//     $gameView.attachCamTo = null;
// }

function updateCamAttach(attachCamTo, copyPosTo) {
    const targetPos = new THREE.Vector3(0, 0, 0,);
    attachCamTo.getWorldPosition(targetPos);
    attachCamTo && copyPosTo.copy(targetPos);
}

function onKeyPress({ key, amount }) {
  console.log('[shipPilot] key press:', key, '->', camControls[key]);

  const control = camControls[key];
  if (!control) {
    // No control mapped for pressed button.
    return;
  }
  // This below should possibly be checked inside the render function, but it
  // feels complicated and wasteful doing so..

  // Ex. 'toggleMouseControl' or 'toggleMousePointer' etc.
  const toggleFn = toggles[control];
  if (toggleFn) {
    toggleFn();
  }
}

function onKeyUpDown({ key, amount, isDown }) {
  console.log('[shipPilot] key:', key, '->', camControls[key], isDown ? '(down)' : '(up)');

  const control = camControls[key];
  if (!control) {
    // No control mapped for pressed button.
    return;
  }
  ctrl[control] = isDown;
}

function onAnalogInput(key, xAbs, yAbs, xDelta, yDelta) {
  console.log('[shipPilot] analog:', key, xAbs, yAbs, xDelta, yDelta);
}

function render(delta) {
  const { playerShip } = $gameView;
  if (!modeActive || !playerShip) {
    return;
  }

  const { scene, camera, renderer } = $gameView;
  updateCamAttach(playerShip.cameras[0], camera.position);

}

export default {
  name: 'shipPilot',
  register,
}
