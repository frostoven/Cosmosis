// Original concept and core engine based almost entirely on this:
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_camera_logarithmicdepthbuffer.html
//
// I hope to make you proud, Senpai. Alas, I'll likely horrify you with my
// code. I'm so sorry.

import * as THREE from 'three';
// import * as CANNON from 'cannon';
import { EffectComposer  } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass  } from 'three/examples/jsm/postprocessing/RenderPass';

import Stats from '../../hackedlibs/stats/stats.module.js';
import CbQueue from './CbQueue';
import { forEachFn } from './utils';
import physics from './physics';
import res from './AssetFinder';
import { controls } from './controls';
import { createSpaceShip } from '../levelLogic/spaceShipLoader';
import { PointerLockControls } from './PointerLockControls';
import { startupEvent, getStartupEmitter } from '../emitters';

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

let composer;

/*
 * Global vars
 * ================================= */

window.$stats = null;
window.$game = {
  // Set to true once the world is fully initialised.
  ready: false,
  // Contains the scene. Mainly used for movement optimisation.
  group: null,
  scene: null,
  camera: null,
  renderer: null,
  spaceWorld: null,
  gravityWorld: null,
  // The loaded file. The 'real' space ship is playerShip.scene.
  playerShip: null,
  // Container for the player ship. Used especially by the warp drive to know
  // what the ship's 'forward' direction is. This allows the 3D artist to model
  // their ship in any orientation, and then use a standard arrow to tell the
  // engine which direction the ship is pointing.
  playerShipBubble: null,
  ptrLockControls: null,
  // The term 'level' here is used very loosely. It's any interactable
  // environment. Space ships as well planet sectors count as levels. Note that
  // only *your own* ship is a level - another players ship is not interactable
  // and just a prop in your world.
  level: null,
  outlinePass: null,
  // If false, the ship and player moves in a static universe. If true, the
  // ship and player is stationary and the universe moves instead. This is to
  // overcome camera glitches. The ship can accelerate up to about about 3000c
  // before hyperspeed becomes non-optional.
  hyperMovement: true,
};
window.$options = {
  // 0=off, 1=basic, 2=full
  hudDetailLevel: 0,
  mouseSpeed: [ 0.5, 0.5 ],
};
window.$displayOptions = {
  // Rendering resolution scale. Great for developers and wood PCs alike.
  resolutionScale: 1,

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
let actionTriggers = [];

const actions = {};

const modes = {
  /** Used to indicate that the action is mode-independent. */
  any: 0,
  /** Refers do being locked in a seat. Used for bridge seats, usually. */
  shipPilot: 1,
  /** Free roam in space, with an intelligently pulsing weak magnetic field
   * activating just enough to keep you from floating away.. until you get too
   * far from it and float away. */
  zeroGMagnetic: 2,
  /** Free roam in space, and on non-rotating spacecraft. */
  zeroGFreeRoam: 3,
  /** Free roam in an environment where you're stuck to the floor. Can be magnetic shoes on a hull. */
  gravityFreeRoam: 4,
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

/** Give mouse 1-3 friendlier names. */
const mouseFriendly = [
  'Left', 'Middle', 'Right',
];

const startupEmitter = getStartupEmitter();

// Used to differentiate between key presses and holding keys down.
const pressedButtons = new Array(4000).fill(false);

const coreKeyToggles = {
  toggleFullScreen: () => {
    const win = nw.Window.get();
    win.toggleFullscreen();
  },
  // lockMouse now handled by toggleMousePointer in individual modes.
  // lockMouse: () => {
  //   console.log('reimplement pointer lock.');
  // },
  // toggleMouseControl: () => $game.ptrLockControls.toggleCamLock(),
  toggleMousePointer: () => $game.ptrLockControls.toggle(),
  toggleHyperMovement: () => {
    $game.hyperMovement = !$game.hyperMovement;
    updateHyperdriveDebugText();
    return $game.hyperMovement;
  },
  showKeyBindings: () => {
    $game.ptrLockControls.unlock();
    const allControlsDiv = document.getElementById('all-controls-page');
    if (allControlsDiv) {
      if (allControlsDiv.style.display !== 'block') {
        allControlsDiv.style.display = 'block';
      }
      else {
        allControlsDiv.style.display = 'none';
      }
    }
  },
  _devChangeMode: () => {
    if (currmode === modes.freeCam) {
      // setMode(modes.godCam);
      setMode(modes.shipPilot);
      toast('Mode set to pilot.');
    }
    // else if (currmode === modes.godCam) {
    //   setMode(modes.shipPilot);
    // }
    else if (currmode === modes.shipPilot) {
      toast('Mode set to free cam.');
      setMode(modes.freeCam);
    }
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

/**
 *
 * @param key
 * @param {number} delta - Change in position.
 * @param {number} invDelta - Change in position of opposite axis.
 * @param {number} gravDelta - Change in position, snaps back.
 * @param {number} gravInvDelta - Change in position of opposite axis, snaps back.
 */
function onAnalogInput(key, delta, invDelta, gravDelta, gravInvDelta) {
  for (let i = 0, len = analogListeners.length; i < len; i++) {
    const { mode, cb } = analogListeners[i];
    if (mode === modes.any || mode === currmode) {
      cb(key, delta, invDelta, gravDelta, gravInvDelta);
    }
  }
}

function onMouseMove(x, y) {
  // const x = event.clientX;
  // const y = event.clientY;

  let deltaX = x - prevMouseX;
  let deltaY = y - prevMouseY;

  // Below: sp means 'special'. Or 'somewhat promiscuous'. Whatever. Used to
  // indicate the 'key' is non-standard.
  if (y > prevMouseY) {
    // console.log('mouse downward');
    onAnalogInput('spSouth', y, x, y - prevMouseY, x - prevMouseX);
  }
  else if (y < prevMouseY) {
    // console.log('mouse upward');
    onAnalogInput('spNorth', y, x, y - prevMouseY, x - prevMouseX);
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

function coreKeyPress(key) {
  const control = coreControls[key];
  const action = coreKeyToggles[control];
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
  if (camInfo.triggerAction) {
    actionTriggers.push(camInfo.triggerAction);
  }
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

  updateModeDebugText();
}

// TODO: remove me once the game is more stable.
function updateModeDebugText() {
  const div = document.getElementById('player-mode');
  if (!div) return;
  if (currmode === modes.shipPilot) div.innerText = 'Mode: Ship pilot';
  else if (currmode === modes.zeroGMagnetic) div.innerText = 'Mode: Zero-G magnetic';
  else if (currmode === modes.zeroGFreeRoam) div.innerText = 'Mode: No gravity';
  else if (currmode === modes.gravityFreeRoam) div.innerText = 'Mode: Gravity';
  else if (currmode === modes.freeCam) div.innerText = 'Mode: Free cam';
  else if (currmode === modes.godCam) div.innerText = 'Mode: God cam';
  else div.innerText = `INVALID MODE: ${currmode}`;
}

// TODO: remove me once the game is more stable.
function updateHyperdriveDebugText() {
  const div = document.getElementById('hyperdrive');
  if (!div) return;
  // if ($game.hyperMovement)
  div.innerText = `Hyperdrive: ${$game.hyperMovement ? 'active' : 'standby'}`;
}

// TODO: remove me once the game is more stable.
function closeLoadingScreen() {
  const divs = document.getElementsByClassName('loading-indicator');
  if (!divs) return;

  for(let i = 0, len = divs.length; i < len; i++){
    // divs[i].style.display = 'none';
    divs[i].classList.add('fadeout');
  }
}

function registerAnalogListener({ mode, cb }) {
  analogListeners.push({ mode, cb });
}

/**
 * @param {string} key - There are 2 variants; standard (i.e. KeyA or Digit1)
 *  and special (i.e. spMouseLeft or spScrollUp).
 */
function simulateKeyPress(key) {
  onKeyPress(key, 0, true);
}

/**
 * @param {string} key - There are 2 variants; standard (i.e. KeyA) and special
 *  (i.e. spMouseLeft).
 */
function simulateKeyDown(key) {
  onKeyUpDown(key, 0, 1, true);
  onKeyPressTracker(key, 0, true);
}

/**
 * @param {string} key - There are 2 variants; standard (i.e. KeyA) and special
 *  (i.e. spMouseLeft).
 */
function simulateKeyUp(key) {
  onKeyUpDown(key, 0, 1, false);
  onKeyPressTracker(key, 0, false);
}

function simulateAnalog() {
  console.log('TBA - use onAnalogInput in the mean time.');
}

/**
 * Triggers an action in all action controllers currently active. Actions in
 * this context relate to the kind of functionality you bind to the keyboard or
 * mouse, i.e. controls.
 * @param {string} action - Examples: thrustReset, lookUp, toggleFullScreen.
 *  See controls/keySchema.*.{string} for examples.
 */
function triggerAction(action) {
  for (let i = 0, len = actionTriggers.length; i < len; i++) {
    const trigger = actionTriggers[i];
    trigger(action);
  }
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
  actionTriggers.push((action) => {
    const fn = coreKeyToggles[action];
    if (fn) {
      fn();
    }
  });
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
      // console.log('Setting cam position to scene default: 0,0,0');
      // pos = new THREE.Vector3(0, 0, 0);
      pos = new THREE.Vector3(392813413, 15716456, -2821306);
    }
    if (!rot) {
      // console.log('Setting cam position to scene default: 0,0,0');
      // rot = new THREE.Vector3(-1.8160, 0.9793, 0.1847);
      rot = new THREE.Vector3(0, 0, 0);
    }

    // Contains all the essential game variables.
    window.$game = initView({ scene, pos, rot });
    startupEmitter.emit(startupEvent.gameViewReady);

    initPlayer();
    updateModeDebugText();

    animate();
    startupEmitter.emit(startupEvent.firstFrameRendered);
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
  const camera = new THREE.PerspectiveCamera(56.25, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR);
  camera.position.copy(pos);
  camera.rotation.setFromVector3(rot);
  scene.add(camera);
  const ptrLockControls = new PointerLockControls(camera, document.body, onMouseMove);

  const renderer = new THREE.WebGLRenderer({...$rendererParams, logarithmicDepthBuffer: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH * $displayOptions.resolutionScale, SCREEN_HEIGHT * $displayOptions.resolutionScale);

  // TODO: give options for shaders 'colourful' vs 'filmic'.
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMapping = THREE.NoToneMapping;

  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.id = 'canvas';
  document.body.appendChild(renderer.domElement);

  // Postprocessing.
  // FIXME: something with post-processing is causing webgl warnings to be
  //  spammed en-mass. I don't see any in-game side-effects, but I can imagine
  //  it's not healthy. This only happens when outlinePass.selectedObjects is
  //  set and starts rendering.
  composer = new EffectComposer( renderer );
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // TODO: check if this needs recreating when window resizes.
  // Outline pass. Used for highlighting interactable objects.
  const outlinePass = new OutlinePass(new THREE.Vector2(SCREEN_WIDTH / SCREEN_HEIGHT), scene, camera);
  outlinePass.edgeStrength = 10; //3;
  outlinePass.edgeGlow = 1; //0;
  outlinePass.edgeThickness = 4; //1;
  outlinePass.pulsePeriod = 2;
  outlinePass.visibleEdgeColor = new THREE.Color(0x00ff5a);
  outlinePass.hiddenEdgeColor = new THREE.Color(0x00ff5a); // seems it always thinks we're hidden :/
  // outlinePass.hiddenEdgeColor = new THREE.Color(0x190a05);
  composer.addPass(outlinePass);

  // Default skybox.
  // TODO: This thing really, REALLY hates being zoomed out beyond 1LY.
  //  Need to find some sort of fix.
  const textureLoader = new THREE.TextureLoader();
  res.getSkybox('panoramic_dark', (error, filename, dir) => {
    if (error) {
      return console.error(error);
    }
    const texture = textureLoader.load(
      `${dir}/${filename}`,
      () => {
        const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
        renderTarget.fromEquirectangularTexture(renderer, texture);
        scene.background = renderTarget;
        startupEmitter.emit(startupEvent.skyBoxLoaded);
      });
  })

  const spaceWorld = physics.initSpacePhysics({ scene, debug: true });
  const group = new THREE.Group();
  group.add(scene);

  return { renderer, scene, camera, ptrLockControls, spaceWorld, outlinePass, group };
}

function initPlayer() {
  createSpaceShip({
    modelName: 'DS69F', onReady: (mesh, bubble) => {
      // modelName: 'scorpion_d', onReady: (mesh, bubble) => {
      // modelName: 'devFlyer', onReady: (mesh, bubble) => {
      // modelName: 'devFlyer2', onReady: (mesh, bubble) => {
      // modelName: 'devFlyer3', onReady: (mesh, bubble) => {
      // modelName: 'tentacleHull', onReady: (mesh, bubble) => {
      // modelName: 'test', onReady: (mesh, bubble) => {
      $game.playerShip = mesh;
      $game.playerShipBubble = bubble;
      startupEmitter.emit(startupEvent.playerShipLoaded);
    }
  });
}

function updateRendererSizes() {
  // Recalculate size for both renderers when screen size or split location changes
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;

  $game.renderer.setSize( SCREEN_WIDTH * $displayOptions.resolutionScale, SCREEN_HEIGHT * $displayOptions.resolutionScale);
  $game.renderer.domElement.style.width = '100%';
  $game.renderer.domElement.style.height = '100%';
  $game.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  $game.camera.updateProjectionMatrix();
}

/**
 * Invokes all registered render functions.
 */
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

  const { scene, camera, renderer, spaceWorld, group, gravityWorld, level, playerShip } = $game;
  spaceWorld && physics.renderPhysics(delta, spaceWorld);
  gravityWorld && physics.renderPhysics(delta, gravityWorld);

  if (level) {
    level.process(delta);
  }

  // TODO: REMOVE ME - this is here to test the cam attaching to the bridge with rotation.
  // if ($game.playerShip) {
  //   $game.playerShip.scene.rotateY(0.001);
  //   $game.playerShip.scene.rotateX(0.001);
  //   $game.playerShip.scene.rotateZ(0.001);
  // }

  renderer.render(group, camera);

  // Run external renderers. We place this after the scene render to prevent
  // the camera from jumping around.
  // TODO: move world, not ship.
  for (let i = 0, len = cachedCamList.length; i < len; i++) {
    const cam = cachedCamList[i];
    cam.render(delta);
  }

  // If the camera is currently anchored to something, update position. Note:
  // always put this after all physics have been calculated or we'll end up
  // with glitchy movement.
  // Use this if you want to update without parenting the camera:
  // $game.ptrLockControls.updateAnchor(); // <- note that this requires setting an anchor first.
  $game.ptrLockControls.updateOrientation();

  // renderer.render(scene, camera);
  renderer.render(group, camera);

  $stats.update();
  composer.render();
}

function moveShip_DELETEME(delta, playerShip) {
  console.log('[moveShip_DELETEME] delta:', delta);
  if (playerShip) {
    const pos = playerShip.scene.position;
    // let {x, y, z} = $game.playerShip.scene.position;
    // z += 100;
    // $game.playerShip.scene.position.set(x, y, z);
    playerShip.scene.translateZ(delta*-10);
  }
}

function onWindowResize() {
  updateRendererSizes();
}

// TODO: remove me once the game is more stable.
startupEmitter.on(startupEvent.playerShipLoaded, () => {
  updateHyperdriveDebugText();
});

// TODO: remove me once the game is more stable.
startupEmitter.on(startupEvent.ready, () => {
  closeLoadingScreen();
});

// Waits for the game to load so that it can trigger startupEvent.ready.
function waitForAllLoaded() {
  let time = 2500;
  let count = 0;
  forEachFn([
    (cb) => startupEmitter.on(startupEvent.skyBoxLoaded, cb),
    (cb) => startupEmitter.on(startupEvent.gameViewReady, cb),
    (cb) => startupEmitter.on(startupEvent.playerShipLoaded, cb),
    (cb) => startupEmitter.on(startupEvent.firstFrameRendered, cb),
  ], () => {
    count++;
  }, () => {
    // Everything else has loaded.
    count++;
    startupEmitter.emit(startupEvent.ready);
  });

  setTimeout(() => {
    if (count !== Object.keys(startupEvent).length) {
      console.warn(
        `Game hasn't finished loading after ${time/1000} seconds. Please investigate.`
      );
    }
    // else console.log('waitForAllLoaded debug message: all fully loaded.');
  }, time);
}
waitForAllLoaded();

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
  simulateKeyPress,
  simulateKeyDown,
  simulateKeyUp,
  simulateAnalog,
  triggerAction,
  coreKeyToggles,
};
