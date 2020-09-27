import * as THREE from "three";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
// import { PointerLockControls } from '../../node_modules/three/examples/jsm/controls/PointerLockControls';
// import { AmmoPhysics } from '../../node_modules/three/examples/jsm/physics/AmmoPhysics';

// import { initPhysics } from './physics';
import { controls } from './controls';
import freeCam from './freeCam';

// let physics;
const actions = {};

const modes = {
  /** Used to indicate that the action is mode-independent. */
  any: 0,
  /** Refers do being locked in a seat. Used for bridge seats, usually. */
  shipPilot: 1,
  /** Free roam in space, and on non-rotating spacecraft. */
  zeroGFreeRoam: 2,
  /** Free roam in an environment where you're stuck to the floor. Can be magnetic shoes on a hull. */
  gravityFreeRoam: 3,
  /** Dev haxxx. */
  freeCam: 9,
};

const modeListeners = [];
const keyUpDownListeners = [/* { mode, cb } */];
const keyPressListeners = [/* { mode, cb } */];

let ptrLockControls;
let currmode = modes.shipPilot;

// Make it easier to determine key positions (i.e. left ctrl vs right ctrl.
const keyLoc = [
    0,    // Unique key.
    1000, // Left side of keyboard.
    2000, // Right side of keyboard.
    3000, // Numpad key.
]

// Used to differentiate between key presses and holding keys down.
const pressedButtons = new Array(4000).fill(false);

function onKeyUpDown(event, isDown) {
  let key = event.keyCode;
  // Make it easier to determine key positions (i.e. left ctrl vs right ctrl.
  key += keyLoc[event.location];

  if (currmode === modes.freeCam) {
    freeCam.onKeyUpDown({ key, isDown })
  }

  for (let i = 0, len = keyUpDownListeners.length; i < len; i++) {
    const { mode, cb } = keyUpDownListeners[i];
    if (mode === modes.any || mode === currmode) {
      cb({ key, isDown });
    }
  }
}

function onKeyPressTracker(event, isDown) {
  let key = event.keyCode;
  // Make it easier to determine key positions (i.e. left ctrl vs right ctrl.
  key += keyLoc[event.location];

  if (!isDown) {
    // console.log(`${key} has been released.`);
    pressedButtons[key] = false;
    return;
  }

  if (pressedButtons[key]) {
    // console.log(`ignoring: ${key}.`);
    return;
  }

  // --- external functions here ------------------------

  coreKeyPress({ key });

  for (let i = 0, len = keyPressListeners.length; i < len; i++) {
    const { mode, cb } = keyPressListeners[i];
    if (mode === modes.any || mode === currmode) {
      cb({ key, isDown });
    }
  }

  // ----------------------------------------------------

  pressedButtons[key] = true;
}

function onGameKeyDown(event) {
  onKeyUpDown(event, true);
  onKeyPressTracker(event, true);
}

function onGameKeyUp(event) {
  onKeyUpDown(event, false);
  onKeyPressTracker(event, false);
}

function coreKeyPress({ key }) {
  // Mouse lock.
  if (controls.allModes.lockMouse.includes(key)) {
    if (ptrLockControls.isLocked) {
      unlockMousePointer();
    }
    else {
      lockMousePointer();
    }
  }
}

function initCanvas({ camera, scene, gl }) {
  console.log('Initialising core.');

  // Default skybox.
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
      'assets/skyboxes/panoramic_dark.png',
      () => {
        const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        const renderer = gl;
        rt.fromEquirectangularTexture(renderer, texture);
        scene.background = rt;
      });

  // Controls.
  document.removeEventListener('keydown', onGameKeyDown);
  document.removeEventListener('keyup', onGameKeyUp);
  // document.removeEventListener('keypress', onKeyPress);
  document.addEventListener('keydown', onGameKeyDown);
  document.addEventListener('keyup', onGameKeyUp);
  // document.addEventListener('keypress', onKeyPress);

  // TODO: use this only with free cam. We need to be able to lock the pointer
  //  for ship navigation as well.
  ptrLockControls = new PointerLockControls(camera, document.body);
}

function getPhysicsInst(onReady) {
  // if (physics) {
  //   return onReady({ physics });
  // }

  // AmmoPhysics(/*{ gravity: { x:0, y:0, z:0 }*/).then((phyInst) => {
  //   console.log('got physics object:', phyInst);
  //   physics = phyInst;
  //   if (onReady) {
  //     onReady({ physics });
  //   }
  // });
  // initPhysics(onReady);

  /*
  async function test() {
    console.log('running');
    return 5;
}
test().then((num) => { console.log('fullfilled:', num); });
*/
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

function registerKeyUpDown({ mode, cb }) {
  keyUpDownListeners.push({ mode, cb });
}

function deregisterKeyUpDown({ mode, cb }) {
  for (let i = 0, len = keyUpDownListeners.length; i < len; i++) {
    if (keyUpDownListeners[i].mode === mode && keyUpDownListeners[i].cb === cb) {
      keyUpDownListeners.splice(index, 1);
      return true;
    }
  }
  return false;
}

function registerKeyPress({ mode, cb }) {
  keyPressListeners.push({ mode, cb });
}

function deregisterKeyPress({ mode, cb }) {
  for (let i = 0, len = keyPressListeners.length; i < len; i++) {
    if (keyPressListeners[i].mode === mode && keyPressListeners[i].cb === cb) {
      keyPressListeners.splice(index, 1);
      return true;
    }
  }
  return false;
}

function registerModeListener(cb) {
  modeListeners.push(cb);
}

function deregisterModeListener(cb) {
  for (let i = 0, len = modeListeners.length; i < len; i++) {
    if (modeListeners[i] === cb) {
      modeListeners.splice(index, 1);
      return true;
    }
  }
  return false;
}

function getMode() {
  return currmode;
}

function setMode(mode) {
  const prevMode = currmode;
  currmode = mode;

  // Inform all listeners of the change.
  for (let i = 0, len = modeListeners.length; i < len; i++) {
    const cb = modeListeners[i];
    cb({ mode: currmode, prevMode });
  }
}

export default {
  initCanvas,
  actions,
  registerGlobalAction,
  deregisterGlobalAction,
  animateFreeCam,
  lockMousePointer,
  unlockMousePointer,
  getPhysicsInst,
  modes,
  getMode,
  setMode,
  registerModeListener,
  deregisterModeListener,
  registerKeyUpDown,
  deregisterKeyUpDown,
  registerKeyPress,
  deregisterKeyPress,
}
