import * as THREE from "three";

import { controls } from '../local/controls';
import core from "../local/core";
import speedTracker from "./utils/speedTracker";

const mode = core.modes.shipPilot;
const camControls = controls.shipPilot;
let speedTimer = null;

let modeActive = false;

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
  toggleMouseControl: () => $gameView.ptrLockControls.toggleCamLock(),
};

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
  $gameView.camera.rotation.setFromVector3(new THREE.Vector3(-3.1, 0.03, 3.13));
}

function updateCamAttach(attachCamTo, copyPosTo) {
    const targetPos = new THREE.Vector3(0, 0, 0,);
    attachCamTo.getWorldPosition(targetPos);
    attachCamTo && copyPosTo.copy(targetPos);
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

  // Ex. 'toggleMouseControl' or 'toggleMousePointer' etc.
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

function onAnalogInput(key, xAbs, yAbs, xDelta, yDelta) {
  // console.log('[shipPilot] analog:', key, xAbs, yAbs, xDelta, yDelta);
}

function triggerAction(action) {
  if (modeActive) {
    const fn = toggles[action];
    if (fn) {
      fn();
    }
  }
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
