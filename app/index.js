import './polyfills';
import './earlyLoad';
import React from 'react';
import * as ReactDOM from 'react-dom';
import RootNode from './reactComponents/RootNode';

import core from './local/core';
import powerOnSelfTest from './test';
import api from './local/api';
import packageJson from '../package.json';
import { onDocumentReady, onReadyToBoot, logBootInfo }
  from './local/windowLoadListener';

// Game modules.
import './local/toast';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { startupEvent, getStartupEmitter } from './emitters';
import './modeControl';
import userProfile from './userProfile';
import { discoverShaders } from '../shaders';
import { logicalSceneGroup } from './logicalSceneGroup';

const startupEmitter = getStartupEmitter();

// Debug reference to three.
window.debug.THREE = THREE;
// Debug reference to cannon.
window.debug.CANNON = CANNON;
// Debug reference to API.
window.debug.api = api;

const defaultScene = logicalSceneGroup.space;

// Integration tests. Note that these will no longer run by itself. The user
// manually runs these by opening the dev console and entering
// 'powerOnSelfTest()'.
window.powerOnSelfTest = powerOnSelfTest;

/* Main
/* --------------------------------- */

console.groupCollapsed(`Pre-init (build number: ${packageJson.version}).`);
logBootInfo(`System boot v${packageJson.version}`); // ▓
discoverShaders();
console.groupEnd();

onDocumentReady(() => {
  window.rootNode = ReactDOM.render(
    <RootNode />,
    document.getElementById('reactRoot'),
  );
});

function initCore() {
  // Glue it together, and start the rendering process.
  core.init({ defaultScene });

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

    api.setPlayerShipLocation(currentPosition.location);
    api.setPlayerShipRotation(currentPosition.rotation);
  });
}

onReadyToBoot(() => {
  discoverShaders(() => {
    logBootInfo('Process units ready');
    initCore();
  });
});
