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
  freeCam: 1,
};

let ptrLockControls;
let mode = modes.freeCam;

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

  if (mode === modes.freeCam) {
    freeCam.onKeyUpDown({ key, isDown })
  }
}

function onKeyPressTracker(event, isDown) {
  let key = event.keyCode;
  // Make it easier to determine key positions (i.e. left ctrl vs right ctrl.
  key += keyLoc[event.location];

  if (!isDown) {
    console.log(`${key} has been released.`);
    pressedButtons[key] = false;
    return;
  }

  if (pressedButtons[key]) {
    console.log(`ignoring: ${key}.`);
    return;
  }

  // --- external functions here ------------------------

  coreKeyPress({ key });

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
  // console.log(`i should not activate often. key`, key)
  // Mouse lock.
  if (controls.allModes.lockMouse.includes(key)) {
    console.log(`i should not activate ONCE. key`, key)
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

export default {
  initCanvas,
  actions,
  registerGlobalAction,
  deregisterGlobalAction,
  animateFreeCam,
  lockMousePointer,
  unlockMousePointer,
  getPhysicsInst,
}
