// Original concept and core engine based almost entirely on this:
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_camera_logarithmicdepthbuffer.html
//
// I hope to make you proud, Senpai. Alas, I'll likely horrify you with my
// code. I'm so sorry.

import * as THREE from 'three';
// import * as CANNON from 'cannon';
import Stats from '../../hackedlibs/stats/stats.module.js';
import packageJson from '../../package.json';

import { forEachFn } from './utils';
// import physics from './physics';
import { PointerLockControls } from './PointerLockControls';
import { startupEvent, getStartupEmitter } from '../emitters';
import contextualInput from './contextualInput';
import { preBootPlaceholder } from '../reactComponents/Modal';
import { logBootInfo } from './windowLoadListener';
import userProfile from '../userProfile';
import {
  activateSceneGroup,
  renderActiveScenes,
  stepAllScenes,
} from '../logicalSceneGroup';

import { createRenderer } from './renderer';
import AssetFinder from './AssetFinder';
import OffscreenSkyboxWorker from '../managedWorkers/OffscreenSkyboxWorker';
import ChangeTracker from '../emitters/ChangeTracker';
import { getEnums } from '../userProfile/defaultsConfigs';
import api from './api';

// 1 micrometer to 100 billion light years in one scene, with 1 unit = 1 meter?
// preposterous!  and yet...
const NEAR = 0.001, FAR = 1e27;

// Used to generate delta.
let deltaPrevTime = 0;
// Used to look for continual animation loop crashes.
let animCrashCheck = 0;
// If the animation loop crashes this amount of frames consecutively, then stop
// rendering.
let maxAllowsAnimCrashes = 600;

/*
 * Global vars
 * ================================= */

window.$stats = null;
window.$game = {
  // Used to stop all main thread graphics processing in an emergency. Game can
  // be halted from the dev console by typing "$game.halt = true".
  halt: false,
  // Note: versions below 0.73.0-beta.4 will not have this value defined.
  version: packageJson.version,
  // Set to true once the world is fully initialised.
  ready: false,
  // Contains the all scenes. Mainly used for movement optimisation. It's
  // possible this has become redundant. TODO: investigate removal.
  // group: null,
  // Contains everything large, including stars / planets / moons. Does not
  // contain spaceships or planetary surfaces (those belong to the level
  // scene).
  // spaceScene: null,
  // Contains everything small.
  // levelScene: null,
  camera: null,
  // The primary graphics renderer.
  primaryRenderer: null,
  // Offscreen renderer used for skybox generation.
  // skyboxRenderer: null,
  // TODO: rename me. Contains level physics (I think). Perhaps delete and
  //  start from scratch canon-es when resuming the physics task.
  // spaceWorld: null,
  gravityWorld: null,
  // The loaded file. The 'real' spaceship is playerShip.scene.
  playerShip: new ChangeTracker(),
  ptrLockControls: null,
  // The term 'level' here is used very loosely. It's any interactable
  // environment. Spaceships as well planet sectors count as levels. Note that
  // only *your own* ship is a level - another players ship is not interactable
  // and just a prop in your world.
  level: null,
  // Draws a flashing border around items that can be interacted with.
  interactablesOutlinePass: null,
  // If false, the ship and player moves in a static universe. If true, the
  // ship and player is stationary and the universe moves instead. This is to
  // overcome camera glitches. The ship can accelerate up to about about 3000c
  // before hyperspeed becomes non-optional.
  // TODO: determine if this has become redundant (we're implementing new positioning methods).
  hyperMovement: false,
  event: {
    offscreenSkyboxReady: new ChangeTracker(),
    skyboxLoaded: new ChangeTracker(),
  },
  api,
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
  // Please do not expose this to users just yet. It utilises setTimeout, which
  // produces significant stutter. It exists to test for timing issues only.
  limitFps: false,
  // On my machine, the frame limiter itself actually causes a 9% performance
  // drop when enabled, hence the 1.09. May need to actually track this
  // dynamically if different per machine. Warn player the frame limiting causes
  // a known ~9% drop.
  fpsLimit: 30 * 1.09,
};
window.$webWorkers = {
  offscreenSkybox: new OffscreenSkyboxWorker(),
};
window.$gfx = {
  fullscreenEffects: new ChangeTracker(),
  spaceEffects: new ChangeTracker(),
  levelEffects: new ChangeTracker(),
};
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

  // User configurations.
  const { debug, display, graphics } = userProfile.getCurrentConfig({
    identifier: 'userOptions'
  });

  // Controls.
  contextualInput.init();

  // Default graphics font.
  // const fontLoader = new THREE.FontLoader();
  const primaryCanvas = document.getElementById('primary-canvas');
  const starfieldCanvas = document.getElementById('starfield-canvas');
  if (!primaryCanvas) {
    $modal.alert('Error: canvas not available; no rendering will work.');
  }

  const camera = new THREE.PerspectiveCamera(
    display.fieldOfView, window.innerWidth / window.innerHeight, NEAR, FAR
  );
  const primaryRenderer = createRenderer({
    initialisation: {
      canvas: primaryCanvas,
    },
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      shadowMapEnabled: graphics.enableShadows,
      shadowMapType: graphics.shadowType,
      devicePixelRatio: window.devicePixelRatio,
      toneMapping: display.toneMapping,
    }
  });

  AssetFinder.getStarCatalogWFallback({
    name: 'bsc5p_3d_min',
    fallbackName: 'constellation_test',
    callback: (error, fileName, parentDir) => {
      $webWorkers.offscreenSkybox.init({
        canvas: starfieldCanvas,
        width: graphics.skyboxResolution,
        height: graphics.skyboxResolution,
        skyboxAntialias: graphics.skyboxAntialias,
        pixelRatio: window.devicePixelRatio,
        catalogPath: `../${parentDir}/${fileName}`,
        disableSkybox: debug.disableSkybox,
        debugSides: debug.debugSkyboxSides,
        debugCorners: debug.debugSkyboxCorners,
      });
    },
  });

  activateSceneGroup({
    renderer: primaryRenderer,
    camera,
    logicalSceneGroup: defaultScene,
    callback: () => {
      initView({ camera, primaryRenderer });
      startupEmitter.emit(startupEvent.gameViewReady);
      logBootInfo('Comms relay ready');

      initPlayer();
      updateModeDebugText();

      animate();
      startupEmitter.emit(startupEvent.firstFrameRendered);
      updatePrimaryRendererSizes();
      logBootInfo('Self-test pass');
    }
  });

  window.$stats = new Stats();
  document.body.appendChild($stats.dom);

  // TODO: move to top of document?
  window.addEventListener('resize', onWindowResize, false);
}

function initView({ primaryRenderer, camera }) {
  const ptrLockControls = new PointerLockControls(camera, document.body);

  // let spaceWorld = null;
  // let group = null;

  // TODO: migrate these the ChangeTracker mechanism.
  $game.primaryRenderer = primaryRenderer;
  $game.camera = camera;
  $game.ptrLockControls = ptrLockControls;
  $game.ready = true;
}

function initPlayer() {
  // TODO: determine if this function still belongs here at all.
}

function updatePrimaryRendererSizes() {
  if (!$game.primaryRenderer) {
    console.error('Cannot update primary renderer: not ready.');
    return;
  }

  // Recalculate size for both renderers when screen size or split location changes
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;

  const { graphics } = userProfile.getCurrentConfig({
    identifier: 'userOptions',
  });

  const scale = graphics.resolutionScale;
  $game.primaryRenderer.setSize(screenWidth * scale, screenHeight * scale);
  $game.primaryRenderer.domElement.style.width = '100%';
  $game.primaryRenderer.domElement.style.height = '100%';
  $game.camera.aspect = screenWidth / screenHeight;
  $game.camera.updateProjectionMatrix();

  console.log('window resized to:', screenWidth, screenHeight);
}

/**
 * Invokes all registered render functions.
 */
function animate() {
  if ($game.halt) {
    return;
  }

  if ($displayOptions.limitFps) {
    setTimeout(animate, 1000 / $displayOptions.fpsLimit);
  }
  else {
    requestAnimationFrame(animate);
  }

  if (animCrashCheck++ > maxAllowsAnimCrashes) {
    const error = 'Renderer animation loop has crashed for 600 consecutive ' +
      'frames. Renderer will now halt.';
    console.error(error);
    $modal.alert({ header: 'Renderer crash', body: error });
    return $game.halt = true;
  }

  const time = performance.now();
  const delta = (time - deltaPrevTime) / 1000;

  deltaPrevTime = time;

  const { primaryRenderer, camera, level } = $game;

  // TODO: move to space LSG?
  if (level) {
    level.process(delta);
  }

  renderActiveScenes({ delta, renderer: primaryRenderer, camera });

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

  if ($stats) {
    $stats.update();
  }

  animCrashCheck = 0;
}

function onWindowResize() {
  updatePrimaryRendererSizes();
}

// TODO: remove me once the game is more stable.
$game.playerShip.getOnce(() => {
  updateHyperdriveDebugText();
});

// TODO: remove me once the game is more stable.
startupEmitter.on(startupEvent.ready, () => {
  closeLoadingScreen();

  // For some reason the game takes nearly 5x longer to boot in fullscreen...
  // slower boot happens even if the res scale is at 0.1 (less than 200x200
  // effective res), albeit not as bad. So I guess we wait until fully booted
  // before switching. Might need to create tiny splash in future that covers
  // the whole window during boot.
  userProfile.cacheChangeEvent.getOnce(({ userOptions }) => {
    const userDisplayChoice = userOptions.display.displayMode;
    const displayEnum = getEnums({ identifier: 'userOptions' }).display;
    if (userDisplayChoice === displayEnum.displayMode.borderlessFullscreen) {
      nw.Window.get().enterFullscreen();
    }
  });
});

// Waits for the game to load so that it can trigger startupEvent.ready.
function waitForAllLoaded() {
  // If the game hasn't booted after this amount of time, complain. Note that
  // it's timed with a low priority timer, so the game may exceed load times by
  // over 500ms before a complaint is triggered. Out target is approximate.
  let warnTime = 4000;

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
      // World and level has loaded.
      count++;
      // TODO: we probably need to migrate the existing systems to the change
      //  tracker, then add change forEachFn to use those instead.
      $game.playerShip.getOnce(() => {
        $game.event.skyboxLoaded.getOnce(() => {
          startupEmitter.emit(startupEvent.ready);
          logBootInfo('Pilot access confirmed');

          // Log boot time.
          const bootTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(
            `Game finished booting after ${bootTime}s. ` +
            `Total startup events: ${count}`
          );
          logBootInfo('Finalising boot');
        });
      });
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
