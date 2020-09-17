import { PointerLockControls } from '../../node_modules/three/examples/jsm/controls/PointerLockControls.js';

import freeCam from './freeCam';

const actions = {};

const modes = {
  freeCam: 1,
};

let ptrLockControls;
let mode = modes.freeCam;

function onKeyChange(event, isDown) {
  if (mode === modes.freeCam) {
    freeCam.keyChange({ key: event.keyCode, isDown })
  }
}

function onGameKeyDown(event) {
  onKeyChange(event, true);
}

function onGameKeyUp(event) {
  onKeyChange(event, false);
}

function initCanvas({ camera }) {
  console.log('Initialising core.');

  // Controls.
  document.removeEventListener('keydown', onGameKeyDown);
  document.removeEventListener('keyup', onGameKeyUp);
  document.addEventListener('keydown', onGameKeyDown);
  document.addEventListener('keyup', onGameKeyUp);

  ptrLockControls = new PointerLockControls(camera, document.body);
}

function animateFreeCam() {
  freeCam.animateFreeCam({ ptrLockControls });
}

function lockMousePointer() {
  ptrLockControls.lock();
}

function unlockMousePointer() {
  ptrLockControls.unlock();
}

function registerGlobalAction({ action, item }) {
  actions[action] = item;
}

function deregisterGlobalAction({ action }) {
  actions[action] = {};
}

const exports = {
  initCanvas,
  actions,
  registerGlobalAction,
  deregisterGlobalAction,
  animateFreeCam,
  lockMousePointer,
  unlockMousePointer,
}

/**
 * Used for easy console debugging. Please do not use this line in actual code.
 */
window.gameCore = exports;

module.exports = exports;
