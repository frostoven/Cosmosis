import './polyfills';
import './earlyProfileLoad';
import './modal';
import './local/PerfTest';
import './debugger';
import v8 from 'v8';

import { loadPlugins } from './plugins';
// import powerOnSelfTest from './test';
import api from './local/api';
import packageJson from '../package.json';
import { onDocumentReady, onReadyToBoot, logBootInfo } from './local/windowLoadListener';

// Game modules.
// import './local/toast';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { startupEvent, getStartupEmitter } from './emitters';
import userProfile from './userProfile';

// THREE.ShaderLib.basic.vertexShader = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ' + THREE.ShaderLib.basic.fragmentShader;
// THREE.ShaderLib.basic.fragmentShader = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ' + THREE.ShaderLib.basic.fragmentShader;

const startupEmitter = getStartupEmitter();

// Debug reference to three.
window.debug.THREE = THREE;
// Debug reference to cannon.
window.debug.CANNON = CANNON;
// Debug reference to API.
window.debug.api = api;

// const defaultScene = logicalSceneGroup.space;

// Integration tests. Note that these will no longer run by itself. The user
// manually runs these by opening the dev console and entering
// 'powerOnSelfTest()'.
// window.powerOnSelfTest = powerOnSelfTest;

/* Main
/* --------------------------------- */

// Generated using https://fsymbols.com/signs/square/
console.log(
  '\n' +
  ' █████╗  █████╗  ██████╗███╗   ███╗ █████╗  ██████╗██╗ ██████╗\n' +
  '██╔══██╗██╔══██╗██╔════╝████╗░████║██╔══██╗██╔════╝██║██╔════╝\n' +
  '██║░░╚═╝██║░░██║╚█████╗░██╔████╔██║██║░░██║╚█████╗░██║╚█████╗ \n' +
  '██║░░██╗██║░░██║░╚═══██╗██║╚██╔╝██║██║░░██║░╚═══██╗██║░╚═══██╗\n' +
  '╚█████╔╝╚█████╔╝██████╔╝██║░╚═╝░██║╚█████╔╝██████╔╝██║██████╔╝\n' +
  ' ╚════╝  ╚════╝ ╚═════╝ ╚═╝     ╚═╝ ╚════╝ ╚═════╝ ╚═╝╚═════╝ ' +
  '\n\n'
);

console.log(`%c► Build ${packageJson.version}`, 'font-weight: bold;');
logBootInfo(`System boot v${packageJson.version}`); // ▓
const heapSize = (
  (v8.getHeapStatistics().heap_size_limit / (1024 * 1024 * 1024)).toFixed(2)
);
console.log(`▪ Max heap size: ${heapSize}GB`);

onDocumentReady(() => {
  // window.rootNode = ReactDOM.render(
  //   <RootNode />,
  //   document.getElementById('reactRoot'),
  // );
});

function init() {
  // Glue it together, and start the rendering process.
  // core.init({ defaultScene, camera });

  startupEmitter.on(startupEvent.gameViewReady, () => {
    // For some god-awful reason or another the browser doesn't always detect
    // invalid pointer locks. This is especially problematic during game boot.
    // This *very frequently* results in the mouse getting stuck in an
    // invisible box, even if the game isn't visible (behind other windows).
    // This is a low overhead albeit dirty work-around.
    // Steps to (unreliably) reproduce:
    //  Ensure HMR is enabled. Switch to IDE, ensure it's maximized. Make a
    //  code change, save. Application reboots in the background. Mouse will
    //  sometimes get trapped in an invisible box.
    // TODO: this fix works maybe 1% of the time. Consider deleting it.
    const mouseLockBugTimer = setInterval(() => {
      const ptr = $game.ptrLockControls;
      if (ptr.isPointerLocked && !document.hasFocus()) {
        console.warn('Releasing invalid mouse lock.');
        ptr.unlock();
      }
    }, 100);
  });

  // Auto switch to hyperdrive for now because we do not yet have regular engines
  // going.
  // TODO: delete me.
  startupEmitter.on(startupEvent.ready, () => {
    api.triggerAction('toggleMousePointer');
    api.triggerAction('engageHyperdrive');

    // TODO: implement mechanism to always keep track of player ship location
    //  and auto-save on occasion. This is not however a current priority and
    //  should only be done once the player actually has systems to explore.
    const { currentPosition } = userProfile.getCurrentConfig({
      identifier: 'gameState',
    });

    api.setPlayerShipLocation(currentPosition.spacetimeControl);
    api.setPlayerShipRotation(currentPosition.rotation);
  });
}

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

onReadyToBoot(() => {
  logBootInfo('Process units ready');
  loadPlugins(() => {
    // gameState.tracked.player.getOnce(({ camera }) => {
    //   init({ camera });
    // });
    closeLoadingScreen();
  });
});
