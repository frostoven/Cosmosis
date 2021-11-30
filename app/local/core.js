// Original concept and core engine based almost entirely on this:
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_camera_logarithmicdepthbuffer.html
//
// I hope to make you proud, Senpai. Alas, I'll likely horrify you with my
// code. I'm so sorry.

import * as THREE from 'three';
// import * as CANNON from 'cannon';
// import { EffectComposer  } from 'three/examples/jsm/postprocessing/EffectComposer';
// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
// import { RenderPass  } from 'three/examples/jsm/postprocessing/RenderPass';
import Stats from '../../hackedlibs/stats/stats.module.js';

import { forEachFn } from './utils';
// import physics from './physics';
import { PointerLockControls } from './PointerLockControls';
import { startupEvent, getStartupEmitter } from '../emitters';
import contextualInput from './contextualInput';
import { preBootPlaceholder } from '../reactComponents/Modal';
import { logBootInfo } from './windowLoadListener';
import {
  activateSceneGroup,
  renderActiveScenes,
  stepAllScenes,
} from '../logicalSceneGroup';

import { createRenderer } from './renderer';
import AssetFinder from './AssetFinder';
import OffscreenSkyboxWorker from '../managedWorkers/OffscreenSkyboxWorker';

// 1 micrometer to 100 billion light years in one scene, with 1 unit = 1 meter?
// preposterous!  and yet...
const NEAR = 0.001, FAR = 1e27;
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;

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
  // Contains the all scenes. Mainly used for movement optimisation. It's
  // possible this has become redundant. TODO: investigate removal.
  // group: null,
  // Contains everything large, including stars / planets / moons. Does not
  // contain space ships or planetary surfaces (those belong to the level
  // scene).
  // spaceScene: null,
  // Contains everything small.
  // levelScene: null,
  camera: null,
  // The primary graphics renderer.
  primaryRenderer: null,
  // Offscreen renderer used for skybox generation.
  skyboxRenderer: null,
  // TODO: rename me. Contains level physics (I think). Perhaps delete and
  //  start from scratch canon-es when resuming the physics task.
  // spaceWorld: null,
  gravityWorld: null,
  // The loaded file. The 'real' space ship is playerShip.scene.
  playerShip: null,
  // Container for the player ship. Used especially by the warp drive to know
  // what the ship's 'forward' direction is. This allows the 3D artist to model
  // their ship in any orientation, and then use a standard arrow to tell the
  // engine which direction the ship is pointing.
  playerWarpBubble: null,
  ptrLockControls: null,
  // The term 'level' here is used very loosely. It's any interactable
  // environment. Space ships as well planet sectors count as levels. Note that
  // only *your own* ship is a level - another players ship is not interactable
  // and just a prop in your world.
  level: null,
  // outlinePass: null,
  // If false, the ship and player moves in a static universe. If true, the
  // ship and player is stationary and the universe moves instead. This is to
  // overcome camera glitches. The ship can accelerate up to about about 3000c
  // before hyperspeed becomes non-optional.
  hyperMovement: true,
};
window.$options = {
  // 0=off, 1=basic, 2=full
  hudDetailLevel: 0,
  // 0=x, 1=y
  mouseSpeed: [0.3 , 0.3],
  // Delay until arrow action repeats.
  repeatDelay: 500,
  // Rate at which arrow actions repeat once repeatDelay is met.
  repeatRate: 50,
};
window.$displayOptions = {
  // Rendering resolution scale. Great for developers and wood PCs alike.
  // TODO: Call this "Resolution quality (Supersampling)" in the graphics menu. // 20% 50% 75% 'match native' 150% 200% 400%
  resolutionScale: 1,

  limitFps: false,
  // On my machine, the frame limiter itself actually causes a 9% performance
  // drop when enabled, hence the 1.09. May need to actually track this
  // dynamically if different per machine. Warn player the frame limiting causes
  // a known ~9% drop.
  fpsLimit: 30 * 1.09,
};
window.$webWorkers = {
  offscreenSkybox: new OffscreenSkyboxWorker(),
}
// TODO: implement anti-aliasing (and other options) in the graphics menu.
// window.$primaryRendererParams = {
//   antialias: true,
// };
// The preBootPlaceholder stores functions that match the actual model object.
// Calling those functions queue them as requests. Once the menu system has
// booted, all requests are then honored as the actual modal functions.
window.$modal = preBootPlaceholder;

/* =================================
 * End global vars
 */

// const allScenes = {};

// const allActionControllers = {};
// let cachedRenderHooks = [];

// const actions = {};

const startupEmitter = getStartupEmitter();

// TODO: check if this is still needed.
// function registerGlobalAction({ action, item }) {
//   actions[action] = item;
// }

// function deregisterGlobalAction({ action }) {
//   actions[action] = {};
// }

// TODO: remove me once the game is more stable.
function updateModeDebugText() {
  const div = document.getElementById('player-mode');
  if (!div) return;

  // if (currmode === modes.shipPilot) div.innerText = 'Mode: Ship pilot';
  // else if (currmode === modes.zeroGMagnetic) div.innerText = 'Mode: Zero-G magnetic';
  // else if (currmode === modes.zeroGFreeRoam) div.innerText = 'Mode: No gravity';
  // else if (currmode === modes.gravityFreeRoam) div.innerText = 'Mode: Gravity';
  // else if (currmode === modes.freeCam) div.innerText = 'Mode: Free cam';
  // else if (currmode === modes.godCam) div.innerText = 'Mode: God cam';
  // else div.innerText = `INVALID MODE: ${currmode}`;
  div.innerText = `INVALID MODE`;
}

// TODO: remove me once the game is more stable.
function updateHyperdriveDebugText() {
  const div = document.getElementById('hyperdrive');
  if (!div) return;
  // TODO: update with new UI.
  // div.innerText = `Hyperdrive: ${$game.hyperMovement ? 'active' : 'standby'}`;
  div.innerText = `Hyperdrive: (unknown...)`;
}

// TODO: remove me once the game is more stable.
function closeLoadingScreen() {
  const loaders = document.getElementsByClassName('loading-indicator');
  if (loaders) {
    for(let i = 0, len = loaders.length; i < len; i++){
      loaders[i].classList.add('splash-fade-out');
    }
  }

  const bootLog = document.getElementById('boot-log');
  if (bootLog) {
    bootLog.classList.add('splash-fade-out');
  }
}

function init({ defaultScene }) {
  console.log('Initialising core.');
  logBootInfo('Core init start');

  // Controls.
  contextualInput.init();

  // Default graphics font.
  // const fontLoader = new THREE.FontLoader();
  const primaryCanvas = document.getElementById('primary-canvas');
  const starfieldCanvas = document.getElementById('starfield-canvas');
  if (!primaryCanvas) {
    $modal.alert('Error: canvas not available; no rendering will work.');
  }

  const camera = new THREE.PerspectiveCamera(56.25, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR);
  const primaryRenderer = createRenderer({
    initialisation: {
      canvas: primaryCanvas,
    },
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      shadowMapEnabled: true,
      // TODO: move into graphics are 'soft shadows'.
      shadowMapType: THREE.PCFSoftShadowMap,
      devicePixelRatio: window.devicePixelRatio,
    }
  });
  // const skyboxRenderer = createRenderer('skyboxRenderer', {
  //   doNotCreateElement: true,
  // });

  AssetFinder.getStarCatalogWFallback({
    name: 'bsc5p_3d_min',
    fallbackName: 'constellation_test',
    callback: (error, fileName, parentDir) => {
      console.log('catalog path:', { error, fileName, parentDir });
      $webWorkers.offscreenSkybox.init({
        canvas: starfieldCanvas,
        width: 2048, // TODO: move skybox resolution to graphics menu.
        height: 2048,
        pixelRatio: window.devicePixelRatio,
        catalogPath: `../${parentDir}/${fileName}`,
      });
    },
  });

  activateSceneGroup({
    primaryRenderer,
    camera,
    logicalSceneGroup: defaultScene,
    callback: () => {
      // $game contains all the essential game variables.
      window.$game = initView({ camera, primaryRenderer });
      startupEmitter.emit(startupEvent.gameViewReady);
      logBootInfo('Comms relay ready');

      initPlayer();
      updateModeDebugText();

      animate();
      startupEmitter.emit(startupEvent.firstFrameRendered);
      logBootInfo('Self-test pass');
    }
  });

  window.$stats = new Stats();
  document.body.appendChild($stats.dom);

  // TODO: move to top of document?
  window.addEventListener('resize', onWindowResize, false);
}

function initView({ primaryRenderer, camera }) {
  // TODO: make FOV adjustable in graphics menu.
  // TODO: all option to press Alt that temporarily zoom in by decreasing perspective.
  // const camera = new THREE.PerspectiveCamera(56.25, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR);
  // camera.position.copy(new THREE.Vector3(0, 0, 0));
  // camera.rotation.setFromVector3(new THREE.Vector3(0, 0, 0));
  // levelScene.add(camera);
  const ptrLockControls = new PointerLockControls(camera, document.body);

  // Postprocessing.
  // --------------------------------------------------------------------------
  // FIXME: something with post-processing is causing webgl warnings to be
  //  spammed en-mass. I don't see any in-game side-effects, but I can imagine
  //  it's not healthy. This only happens when outlinePass.selectedObjects is
  //  set and starts rendering.
  // --------------------------------------------------------------------------
  // composer = new EffectComposer(renderer);
  // const renderPass = new RenderPass(levelScene, camera);
  // composer.addPass(renderPass);
  //
  // // TODO: check if this needs recreating when window resizes.
  // // Outline pass. Used for highlighting interactable objects.
  // const outlinePass = new OutlinePass(new THREE.Vector2(SCREEN_WIDTH / SCREEN_HEIGHT), levelScene, camera);
  // outlinePass.edgeStrength = 10; //3;
  // outlinePass.edgeGlow = 1; //0;
  // outlinePass.edgeThickness = 4; //1;
  // outlinePass.pulsePeriod = 2;
  // outlinePass.visibleEdgeColor = new THREE.Color(0x00ff5a);
  // outlinePass.hiddenEdgeColor = new THREE.Color(0x00ff5a); // seems it always thinks we're hidden :/
  // // outlinePass.hiddenEdgeColor = new THREE.Color(0x190a05);
  // composer.addPass(outlinePass);
  // --------------------------------------------------------------------------

  // Default skybox.
  // TODO: This thing really, REALLY hates being zoomed out beyond 1LY.
  //  Need to find some sort of fix.
  // const textureLoader = new THREE.TextureLoader();
  // res.getSkybox('panoramic_dark', (error, filename, dir) => {
  //   if (error) {
  //     return console.error(error);
  //   }
  //   const texture = textureLoader.load(
  //     `${dir}/${filename}`,
  //     () => {
  //       const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
  //       renderTarget.fromEquirectangularTexture(renderer, texture);
  //       spaceScene.background = renderTarget;
  //       startupEmitter.emit(startupEvent.skyBoxLoaded);
  //       logBootInfo('Astrometrics ready');
  //     });
  // });

  // let spaceWorld = null;
  // let group = null;

  return {
    primaryRenderer, camera,
    ptrLockControls, ready: true
  };
}

function initPlayer() {
  // TODO: determine if this function still belongs here at all.
}

function updatePrimaryRendererSizes() {
  if (!$game.primaryRenderer) {
    return;
  }
  // Recalculate size for both renderers when screen size or split location changes
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;

  $game.primaryRenderer.setSize( SCREEN_WIDTH * $displayOptions.resolutionScale, SCREEN_HEIGHT * $displayOptions.resolutionScale);
  $game.primaryRenderer.domElement.style.width = '100%';
  $game.primaryRenderer.domElement.style.height = '100%';
  $game.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  $game.camera.updateProjectionMatrix();

  console.log('window resized to:', SCREEN_WIDTH, SCREEN_HEIGHT);
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

  const {
    primaryRenderer, camera,
    gravityWorld, level, playerShip
  } = $game;

  if (level) {
    level.process(delta);
  }

  renderActiveScenes({ renderer: primaryRenderer, camera });

  // Run external renderers. We place this after the scene render to prevent
  // the camera from jumping around.
  stepAllScenes({ delta });
  // TODO: move world, not ship. bookm 414
  // for (let i = 0, len = cachedRenderHooks.length; i < len; i++) {
  //   const controller = cachedRenderHooks[i];
  //   controller.render(delta);
  // }

  // If the camera is currently anchored to something, update position. Note:
  // always put this after all physics have been calculated or we'll end up
  // with glitchy movement.
  // Use this if you want to update without parenting the camera:
  // $game.ptrLockControls.updateAnchor(); // <- note that this requires setting an anchor first.

  // TODO: move this to shipPilot?
  $game.ptrLockControls.updateOrientation();

  $stats.update();

  // TODO: This currently erases spaceScene. Find a way to prevent that.
  // composer.render();
}

function onWindowResize() {
  updatePrimaryRendererSizes();
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
  // If the game hasn't booted after this amount of time, complain. Note that
  // it's timed with a low priority timer, so the game may exceed load times by
  // over 500ms before a complaint is triggered. Out target is approximate.
  let warnTime = 3000;

  // Used to measure boot time. The start time is intentionally only after core
  // has loaded because we don't care about the boot time of external factors
  // (such as how long it takes nw.js to get ready).
  const startTime = Date.now();

  // Contains callback functions used to keep track of game load progress.
  const startupEmitters = [];

  // Create all callback functions that will be stored in startupEmitters.
  const allStartupEvents = Object.keys(startupEvent);
  for (let i = 0, len = allStartupEvents.length; i < len; i++) {
    const key = allStartupEvents[i];
    if (key === 'ready') {
      // Skip 'ready' - it's manually triggered in the end.
      continue;
    }
    startupEmitters.push(
      (next) => startupEmitter.on(startupEvent[key], next),
    );
  }

  let count = 0;
  forEachFn(
    // Wait for everything but 'ready' to trigger.
    startupEmitters,
    () => count++,
    () => {
      // Everything has loaded.
      count++;
      startupEmitter.emit(startupEvent.ready);
      logBootInfo('Pilot access confirmed');

      // Log boot time.
      const bootTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `Game finished booting after ${bootTime}s. ` +
        `Total startup events: ${count}`
      );
      logBootInfo('Finalising boot');

      // Adjust camera perspective on resize.
      // window.onresize = function() {
        // let SCREEN_WIDTH = window.innerWidth;
        // let SCREEN_HEIGHT = window.innerHeight;
      // }
    });

  setTimeout(() => {
    if (count !== allStartupEvents.length) {
      console.warn(
        `Game hasn't finished booting after ${warnTime / 1000}s (currently ` +
        `at ${count}/${allStartupEvents.length}). Please investigate.`
      );
    }
  }, warnTime);
}
waitForAllLoaded();

/**
 * Adjusts x and y according to user-chosen mouse sensitivity.
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}}
 */
function userMouseSpeed(x, y) {
  return {
    x: $options.mouseSpeed[0] * x,
    y: $options.mouseSpeed[1] * y,
  };
}

export default {
  // actions,
  // registerGlobalAction,
  // deregisterGlobalAction,
  init,
  // registerScene,
  // registerRenderHook,
  userMouseSpeed,
};
