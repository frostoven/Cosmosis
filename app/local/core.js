// Original concept and core engine based almost entirely on this:
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_camera_logarithmicdepthbuffer.html
//
// I hope to make you proud, Senpai. Alas, I'll likely horrify you with my
// code. I'm so sorry.

import * as THREE from 'three';
import * as CANNON from 'cannon';

import Stats from '../../hackedlibs/stats/stats.module.js';
import CbQueue from "./CbQueue";
import physics from './physics';
import { controls } from './controls';
import {createSpaceShip} from "../mechanics/spaceShipLoader";
import {PointerLockControls} from "./PointerLockControls";

const gameFont = 'node_modules/three/examples/fonts/helvetiker_regular.typeface.json';

// 1 micrometer to 100 billion light years in one scene, with 1 unit = 1 meter?
// preposterous!  and yet...
const NEAR = 1e-6, FAR = 1e27;
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;

// Used be coreKeyPress.
const coreControls = controls.allModes;

// Used to generate delta.
let deltaPrevTime = Date.now();

/*
 * Global vars
 * ================================= */

window.$stats = null;
window.$gameView = {
  // Set to true once the world is fully initialised.
  ready: false,
  scene: null,
  camera: null,
  renderer: null,
  spaceWorld: null,
  gravityWorld: null,
  // attachCamTo: null,
  playerShip: null,
  ptrLockControls: null,
};
window.$options = {
  // 0=off, 1=basic, 2=full
  hudDetailLevel: 0,
  mouseSpeed: [ 0.5, 0.5 ],
};
window.$displayOptions = {
  // Rendering resolution scale. Great for developers and wood PCs alike.
  resolutionScale: 1.5,

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

// Debug reference to three.
window.$THREE = THREE;
// Debug reference to cannon.
window.$CANNON = CANNON;

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

// TODO: This was a design mistake that needs to be addressed. Modes are not
//  mutually exclusive. You can have more than one active at a time, with
//  preference based on some predefined [hardcoded] priority. Dark Souls
//  example: you can run around while in ANY menu, but they arrow and
//  interaction keys stop working because they're now snatched by the menu;
//  elite and others do something similar.
//  #
//  It comes down to this: for each active mode, send the key pressed. The loop
//  order is determined by priority. If the key is intercepted, offer the
//  option to preventDefault [sticking with js jargon]. The easiest solution is
//  likely to make this var a bitmask.
let currmode = modes.shipPilot;

let prevMouseX = 0;
let prevMouseY = 0;

/** Triggers on mode change. */
const modeListeners = new CbQueue();
/** Anything with graph numbers, like mouse, analog stick, etc. */
const analogListeners = [];
/** Triggers when keys are pressed, and when they are released. */
const keyUpDownListeners = [/* { mode, cb } */];
/** Triggers when keys are pressed, but not when they are released. */
const keyPressListeners = [/* { mode, cb } */];
/** Called after this computer's player's ship has been loaded. */
const playerShipReadyListeners = new CbQueue();

/** Give mouse 1-3 friendlier names. */
const mouseFriendly = [
  'Left', 'Middle', 'Right',
];

// Used to differentiate between key presses and holding keys down.
const pressedButtons = new Array(4000).fill(false);

const coreKeyActions = {
  enterFullScreen: () => {
    //   require('nw.gui').Window.get().maximize();
    const body = document.body.requestFullscreen();
    if (body.requestFullscreen) {
      body.requestFullscreen();
    }
  },
  // lockMouse now handled by individual modes.
  // lockMouse: () => {
  //   console.log('reimplement pointer lock.');
  // },
  _devChangeMode: () => {
    console.log('currmode:', currmode);
    if (currmode === modes.freeCam) {
      // setMode(modes.godCam);
      setMode(modes.shipPilot);
    }
    // else if (currmode === modes.godCam) {
    //   setMode(modes.shipPilot);
    // }
    else if (currmode === modes.shipPilot) {
      setMode(modes.freeCam);
    }
    console.log('Changed mode to:', currmode);
  },
};

function onKeyUpDown(key, metadata, amount, isDown) {
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
  coreKeyPress(key, amount, isDown);
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

function onMouseMove(x, y) {
  // const x = event.clientX;
  // const y = event.clientY;

  // Below: sp means 'special'. Or 'somewhat promiscuous'. Whatever. Used to
  // indicate the 'key' is non-standard.
  if (y > prevMouseY) {
    // console.log('mouse downward');
    onAnalogInput('spSouth', x, y, x - prevMouseX, y - prevMouseY);
  }
  else if (y < prevMouseY) {
    // console.log('mouse upward');
    onAnalogInput('spNorth', x, y, x - prevMouseX, y - prevMouseY);
  }

  if (x > prevMouseX) {
    // console.log('mouse right');
    onAnalogInput('spEast', x, y, x - prevMouseX, y - prevMouseY);
  }
  else if (x < prevMouseX) {
    // console.log('mouse left');
    onAnalogInput('spWest', x, y, x - prevMouseX, y - prevMouseY);
  }

  prevMouseX = x;
  prevMouseY = y;
}

/**
 * Keeps track of key presses and releases. Signals presses, but not releases.
 * Does not handle mouse scroll wheel. Should support gamepads in future.
 * @param key
 * @param metadata
 * @param isDown
 */
function onKeyPressTracker(key, metadata, isDown) {
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
  onKeyUpDown(event.code, event.location, 1, true);
  onKeyPressTracker(event.code, event.location, true);
}

function onGameKeyUp(event) {
  onKeyUpDown(event.code, event.location, 1, false);
  onKeyPressTracker(event.code, event.location, false);
}

function onMouseDown(event) {
  let name = mouseFriendly[event.button];
  if (!name) name = event.button;
  onKeyUpDown(`spMouse${name}`, event, 1, true);
  onKeyPressTracker(`spMouse${name}`, event, true);
}

function onMouseUp(event) {
  let name = mouseFriendly[event.button];
  if (!name) name = event.button;
  onKeyUpDown(`spMouse${name}`, event, 1, false);
  onKeyPressTracker(`spMouse${name}`, event, false);
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
    onKeyPress('spScrollDown', amount, true);
  }
  else {
    // Scrolling up.
    onKeyPress('spScrollUp', amount, true);
  }
  // console.log('scroll:', amount);

  // const dir = amount / Math.abs(amount);
  // zoomSpeed = dir / 10;
  //
  // // Slow down default zoom speed after user starts zooming, to give them more control
  // minZoomSpeed = 0.001;
}

function coreKeyPress(key, amount, isDown) {
  const control = coreControls[key];
  const action = coreKeyActions[control];
  if (action) {
    action();
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

// const registerModeListener = cb => modeListeners.registerListener(cb);
// const deregisterModeListener = cb => modeListeners.deregisterModeListener(cb);

function getMode() {
  return currmode;
}

function setMode(mode) {
  const prevMode = currmode;
  currmode = mode;

  // Inform all listeners of the change.
  modeListeners.notifyAll((cb) =>
      cb({ mode: currmode, prevMode })
  );

  // for (let i = 0, len = modeListeners.length; i < len; i++) {
  //   const cb = modeListeners[i];
  //   cb({ mode: currmode, prevMode });
  // }
}

function registerAnalogListener({ mode, cb }) {
  analogListeners.push({ mode, cb });
}

function deregisterAnalogListener({ mode, cb }) {
  for (let i = 0, len = analogListeners.length; i < len; i++) {
    if (analogListeners[i].mode === mode && analogListeners[i].cb === cb) {
      analogListeners.splice(i, 1);
      return true;
    }
  }
  return false;
}

function runLoaders(loaders, onLoad) {
  //
}

function init({ sceneName, pos, rot }) {
  console.log('Initialising core.');
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

    if (!pos) {
      // TODO: implement scene default pos/rot, 0,0,0 in case of legDepthDemo.
      //  For localCluster: x:392813413, y:15716456, z:-2821306
      //               rot: x:-1.8765, y:1.1128, z:0.2457
      console.log('Setting cam position to scene default: 0,0,0');
      // pos = new THREE.Vector3(0, 0, 0);
      pos = new THREE.Vector3(392813413, 15716456, -2821306);
    }
    if (!rot) {
      console.log('Setting cam position to scene default: 0,0,0');
      rot = new THREE.Vector3(-1.8160, 0.9793, 0.1847);
    }

    // Initialize two copies of the same scene, one with normal z-buffer and one with logarithmic z-buffer
    // objects.normal = initView( scene, 'normal', false );
    $gameView = initView({ scene, pos, rot });
    // TODO: make this a callback instead, chain initPlayer into that callback,
    //  and make the ready callback fire globally when initPlayer is done.
    $gameView.ready = true;
    initPlayer();
    animate();
  });

  $stats = new Stats();
  document.body.appendChild($stats.dom);

  // TODO: turn these into a godcam modeswitch.
  window.addEventListener('resize', onWindowResize, false);

  // Controls.
  document.removeEventListener('keydown', onGameKeyDown);
  document.removeEventListener('keyup', onGameKeyUp);
  // document.removeEventListener('keypress', onKeyPress);
  document.addEventListener('keydown', onGameKeyDown);
  document.addEventListener('keyup', onGameKeyUp);
  // document.addEventListener('keypress', onKeyPress);
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mouseup', onMouseUp, false);
  window.addEventListener('wheel', onMouseWheel, false);

  // Now handled by ptrLockControls instead.
  // window.addEventListener('mousemove', onMouseMove, false);

  // Send out mode trigger.
  setMode(currmode);
}

function initView({ scene, pos, rot }) {
  const camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR);
  camera.position.copy(pos);
  camera.rotation.setFromVector3(rot);
  scene.add(camera);
  const ptrLockControls = new PointerLockControls(camera, document.body, onMouseMove);

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
    'potatoLqAssets/skyboxes/panoramic_dark.png',
    () => {
      const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
      renderTarget.fromEquirectangularTexture(renderer, texture);
      scene.background = renderTarget;
    });

  const spaceWorld = physics.initSpacePhysics({ scene, debug: true });

  return { renderer, scene, camera, ptrLockControls, spaceWorld };
}

function initPlayer() {
  // // Externals.
  // spaceShipLoader.getMesh('DS69F', (mesh) => {
  //   mesh.scene.position.copy($gameView.camera.position);
  //   scene.add(mesh.scene);
  //   console.log('=> DS69F added to scene.');
  // });
  createSpaceShip({
    modelName: 'DS69F', onReady: (mesh) => {
      $gameView.playerShip = mesh;
      playerShipReadyListeners.notifyAll((cb) => {
        cb(mesh);
      });
      // console.log('==> ship stored in $gameView.');
    }
  });
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
  const delta = (time - deltaPrevTime) / 1000;

  requestAnimationFrame(() => {
    if ($displayOptions.limitFps) {
      setTimeout(animate, 1000 / $displayOptions.fpsLimit);
    }
    else {
      animate();
    }
  });
  deltaPrevTime = time;

  // Run external renderers.
  for (let i = 0, len = cachedCamList.length; i < len; i++) {
    const cam = cachedCamList[i];
    cam.render(delta);
  }

  const { scene, camera, renderer, spaceWorld, gravityWorld, /*attachCamTo*/ } = $gameView;
  spaceWorld && physics.renderPhysics(delta, spaceWorld);
  gravityWorld && physics.renderPhysics(delta, gravityWorld);

  // if (attachCamTo) {
  //   const targetPos = new THREE.Vector3(0, 0, 0,);
  //   attachCamTo.getWorldPosition(targetPos);
  //   attachCamTo && camera.position.copy(targetPos);
  // }

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
  modeListeners,
  registerKeyUpDown,
  deregisterKeyUpDown,
  registerKeyPress,
  deregisterKeyPress,
  init,
  registerScene,
  registerCamControl,
  registerAnalogListener,
  deregisterAnalogListener,
  playerShipReadyListeners,
};
