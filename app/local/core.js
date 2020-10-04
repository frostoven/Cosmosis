// Original concept taken from here:
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_camera_logarithmicdepthbuffer.html
//
// I hope to make you proud, Senpai. Alas, I'll likely horrify you with my
// code.

import * as THREE from 'three';

import Stats from '../../hackedlibs/stats/stats.module.js';
import { controls, keymap } from './controls';

const gameFont = 'node_modules/three/examples/fonts/helvetiker_regular.typeface.json';

// 1 micrometer to 100 billion light years in one scene, with 1 unit = 1 meter?
// preposterous!  and yet...
const NEAR = 1e-6, FAR = 1e27;
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;

let prevTime = Date.now();

/*
 * Global vars
 * ================================= */

window.$stats = null;
window.$gameView = {
  scene: null,
  camera: null,
  renderer: null,
};
window.$options = {
  // 0=off, 1=basic, 2=full
  hudDetailLevel: 0,
  mouseSpeed: [ 0.5, 0.5 ],
};
window.$displayOptions = {
  // Rendering resolution scale. Great for developers and wood PCs alike.
  resolutionScale: 0.5,

  limitFps: false,
  // On my machine, the frame limiter itself actually causes a 9% performance
  // drop when enabled, hence the 1.09. May need to actually track this
  // dynamically if different per machine. Warn player the frame limiting causes
  // a known ~9% drop.
  fpsLimit: 30 * 1.09,
}
window.$rendererParams = {
  antialias: true,
}

/* =================================
 * End global vars
 */

const allScenes = {};
let activeScene = '';

const allCamControllers = {};
let cachedCamList = [];

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
  godCam: 10,
};

let currmode = modes.freeCam;

let prevMouseX = 0;
let prevMouseY = 0;

/** Triggers on mode change. */
const modeListeners = [];
/** Anything with graph numbers, like mouse, analog stick, etc. */
const analogListeners = [];
/** Triggers when keys are pressed, and when they are released. */
const keyUpDownListeners = [/* { mode, cb } */];
/** Triggers when keys are pressed, but not when they are released. */
const keyPressListeners = [/* { mode, cb } */];

// Make it easier to determine key positions (i.e. left ctrl vs right ctrl.
const keyLoc = [
  0,    // Unique key.
  1000, // Left side of keyboard.
  3000, // Right side of keyboard.
  7000, // Numpad key.
];

// Used to differentiate between key presses and holding keys down.
const pressedButtons = new Array(4000).fill(false);

function onKeyUpDown(key, location, amount, isDown) {
  // Make it easier to determine key positions (i.e. left ctrl vs right ctrl.
  key += keyLoc[location];

  // if (currmode === modes.freeCam) {
  //   freeCam.onKeyUpDown({ key, amount, isDown })
  // }

  for (let i = 0, len = keyUpDownListeners.length; i < len; i++) {
    const { mode, cb } = keyUpDownListeners[i];
    if (mode === modes.any || mode === currmode) {
      cb({ key, isDown });
    }
  }
}

/**
 * Emits an event indicating a key has been pressed. Does not signal a release.
 * Used directly for scroll wheel, used indirectly for keyboard.
 * @param key
 * @param isDown
 */
function onKeyPress(key, amount, isDown) {
  coreKeyPress({ key });
  for (let i = 0, len = keyPressListeners.length; i < len; i++) {
    const { mode, cb } = keyPressListeners[i];
    if (mode === modes.any || mode === currmode) {
      cb({ key, amount, isDown });
    }
  }
}

function onAnalogInput(key, xAbs, yAbs, xDelta, yDelta) {
  for (let i = 0, len = analogListeners.length; i < len; i++) {
    const { mode, cb } = analogListeners[i];
    if (mode === modes.any || mode === currmode) {
      cb(key, xAbs, yAbs, xDelta, yDelta);
    }
  }
}

function onMouseMove(event) {
  const x = event.clientX;
  const y = event.clientY;

  if (y > prevMouseY) {
    // console.log('mouse downward');
    onAnalogInput(keymap.mouseSouth, x, y, x - prevMouseX, y - prevMouseY);
  }
  else if (y < prevMouseY) {
    // console.log('mouse upward');
    onAnalogInput(keymap.mouseNorth, x, y, x - prevMouseX, y - prevMouseY);
  }

  if (x > prevMouseX) {
    // console.log('mouse right');
    onAnalogInput(keymap.mouseEast, x, y, x - prevMouseX, y - prevMouseY);
  }
  else if (x < prevMouseX) {
    // console.log('mouse left');
    onAnalogInput(keymap.mouseWest, x, y, x - prevMouseX, y - prevMouseY);
  }

  prevMouseX = x;
  prevMouseY = y;
}

/**
 * Keeps track of key presses and releases. Signals presses, but not releases.
 * Does not handle mouse scroll wheel. Should support gamepads in future.
 * @param key
 * @param location
 * @param isDown
 */
function onKeyPressTracker(key, location, isDown) {
  // Make it easier to determine key positions (i.e. left ctrl vs right ctrl.
  key += keyLoc[location];

  if (!isDown) {
    // console.log(`${key} has been released.`);
    pressedButtons[key] = false;
    return;
  }

  if (pressedButtons[key]) {
    // console.log(`ignoring: ${key}.`);
    return;
  }

  // Amount for a keypress tracking is *always* 1, even if it's a throttle.
  onKeyPress(key, 1, isDown);
  pressedButtons[key] = true;
}

function onGameKeyDown(event) {
  onKeyUpDown(event.keyCode, event.location, 1, true);
  onKeyPressTracker(event.keyCode, event.location, true);
}

function onGameKeyUp(event) {
  onKeyUpDown(event.keyCode, event.location, 1, false);
  onKeyPressTracker(event.keyCode, event.location, false);
}

/**
 * Note: core will always emit a keyDown but never a keyUp for scroll events.
 * @param event
 */
function onMouseWheel(event) {
  const amount = event.deltaY;
  if ( amount === 0 ){
    return;
  }
  else if (amount > 0) {
    // Scrolling down.
    onKeyPress(keymap.scrollDown, amount, true);
  }
  else {
    // Scrolling up.
    onKeyPress(keymap.scrollUp, amount, true);
  }
  // console.log('scroll:', amount);

  // const dir = amount / Math.abs(amount);
  // zoomSpeed = dir / 10;
  //
  // // Slow down default zoom speed after user starts zooming, to give them more control
  // minZoomSpeed = 0.001;
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

/**
 * Registers a scene. Requires sceneInfo object.
 */
function registerScene(sceneInfo={}) {
  let errors = 0;
  if (!sceneInfo.name) {
    console.error('Error: registerScene requires a name.');
    errors++;
  }
  if (!sceneInfo.init) {
    console.error('Error: registerScene requires an init function.');
    errors++;
  }
  if (allScenes[sceneInfo.name]) {
    console.error(
      `Error: attempted to registering scene ${sceneInfo.name} twice. This ` +
      'is likely a bug.'
    );
    errors++;
  }
  if (errors > 0) {
    return;
  }

  allScenes[sceneInfo.name] = sceneInfo;
}

function registerCamControl(camInfo={}) {
  let errors = 0;
  if (!camInfo.name) {
    console.error('Error: registerScene requires a name.');
    errors++;
  }
  if (!camInfo.render) {
    console.error('Error: registerScene requires a render function.');
    errors++;
  }
  if (allScenes[camInfo.name]) {
    console.error(
      `Error: attempted to registering scene ${camInfo.name} twice. This ` +
      'is likely a bug.'
    );
    errors++;
  }
  if (errors > 0) {
    return;
  }

  allCamControllers[camInfo.name] = camInfo;
  cachedCamList.push(camInfo);
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

function registerAnalogChange({ mode, cb }) {
  analogListeners.push({ mode, cb });
}

function deregisterAnalogChange({ mode, cb }) {
  for (let i = 0, len = analogListeners.length; i < len; i++) {
    if (analogListeners[i].mode === mode && analogListeners[i].cb === cb) {
      analogListeners.splice(index, 1);
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

function registerAnalogListener({ mode, cb }) {
  analogListeners.push({ mode, cb });
}

function deregisterAnalogListener({ mode, cb }) {
  for (let i = 0, len = analogListeners.length; i < len; i++) {
    if (analogListeners[i].mode === mode && analogListeners[i].cb === cb) {
      analogListeners.splice(index, 1);
      return true;
    }
  }
  return false;
}

function runLoaders(loaders, onLoad) {
  //
}

function init(sceneName) {
  console.log('Initialising core.');

  // =============================================================================================================
  // =============================================================================================================

  activeScene = sceneName;

  // Default graphics font.
  const fontLoader = new THREE.FontLoader();
  fontLoader.load(gameFont, function (font) {
    const startupScene = allScenes[sceneName];
    if (!startupScene) {
      return console.error(`Error: default scene ${sceneName} hasn't been registered.`);
    }
    // const scene = initScene({ font });
    const scene = startupScene.init({ font });

    // Initialize two copies of the same scene, one with normal z-buffer and one with logarithmic z-buffer
    // objects.normal = initView( scene, 'normal', false );
    $gameView = initView(scene);
    animate();
  });

  $stats = new Stats();
  document.body.appendChild($stats.dom);

  // TODO: turns these into a godcam modeswitch.
  window.addEventListener('resize', onWindowResize, false);


  // =============================================================================================================
  // =============================================================================================================




  // Controls.
  document.removeEventListener('keydown', onGameKeyDown);
  document.removeEventListener('keyup', onGameKeyUp);
  // document.removeEventListener('keypress', onKeyPress);
  document.addEventListener('keydown', onGameKeyDown);
  document.addEventListener('keyup', onGameKeyUp);
  // document.addEventListener('keypress', onKeyPress);
  window.addEventListener('wheel', onMouseWheel, false);
  window.addEventListener('mousemove', onMouseMove, false);


  // TODO: use this only with free cam. We need to be able to lock the pointer
  //  for ship navigation as well.
  // ptrLockControls = new PointerLockControls(camera, document.body);

  // Send out mode trigger.
  setMode(currmode);
}

function initView(scene) {
  const camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({...$rendererParams, logarithmicDepthBuffer: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH * $displayOptions.resolutionScale, SCREEN_HEIGHT * $displayOptions.resolutionScale);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.id = 'canvas';
  document.body.appendChild(renderer.domElement);

  // Default skybox.
  // TODO: This thing really, REALLY hates being zoomed out beyond 1LY.
  //  Need to find some sort of fix.
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(
    'assets/skyboxes/panoramic_dark.png',
    () => {
      const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
      renderTarget.fromEquirectangularTexture(renderer, texture);
      scene.background = renderTarget;
    });

  return { renderer: renderer, scene: scene, camera: camera };
}


function updateRendererSizes() {
  // Recalculate size for both renderers when screen size or split location changes
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;

  $gameView.renderer.setSize( SCREEN_WIDTH * $displayOptions.resolutionScale, SCREEN_HEIGHT * $displayOptions.resolutionScale);
  $gameView.renderer.domElement.style.width = '100%';
  $gameView.renderer.domElement.style.height = '100%';
  $gameView.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  $gameView.camera.updateProjectionMatrix();
}

function animate() {
  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  requestAnimationFrame(() => {
    if ($displayOptions.limitFps) {
      setTimeout(animate, 1000 / $displayOptions.fpsLimit);
    }
    else {
      animate();
    }
  });
  prevTime = time;

  // Run external renderers.
  for (let i = 0, len = cachedCamList.length; i < len; i++) {
    const cam = cachedCamList[i];
    cam.render(delta);
  }

  const { scene, camera, renderer } = $gameView;
  renderer.render(scene, camera);
  $stats.update();
}


function onWindowResize() {
  updateRendererSizes();
}

export default {
  actions,
  registerGlobalAction,
  deregisterGlobalAction,
  // lockMousePointer,
  // unlockMousePointer,
  // getPhysicsInst,
  modes,
  getMode,
  setMode,
  registerModeListener,
  deregisterModeListener,
  registerKeyUpDown,
  deregisterKeyUpDown,
  registerKeyPress,
  deregisterKeyPress,
  init,
  registerScene,
  registerCamControl,
  registerAnalogListener,
  deregisterAnalogListener,
};
