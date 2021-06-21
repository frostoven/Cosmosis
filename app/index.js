import React from 'react';
import * as ReactDOM from 'react-dom';
import RootNode from './reactComponents/RootNode';

import core from './local/core';
import powerOnSelfTest from './test';
import api from './local/api';
import packageJson from '../package.json';
import onDocumentReady from './local/windowLoadListener';

// Game modules.
import scenes from './scenes';
import cameraControllers from './cameraControllers';
import './local/toast';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { Vector3 } from 'three';
import { startupEvent, getStartupEmitter } from './emitters';

const startupEmitter = getStartupEmitter();

// Debug reference to three.
window.debug.THREE = THREE;
// Debug reference to cannon.
window.debug.CANNON = CANNON;
// Debug reference to API.
window.debug.API = api;

// const defaultScene = 'logDepthDemo';
const defaultScene = 'localCluster';

// Integration tests. Note that these won't actually by itself. The user
// manually runs these by opening the dev console and entering
// 'powerOnSelfTest()'.
window.powerOnSelfTest = powerOnSelfTest;

/* Auto dev reloading
/* --------------------------------- */

if (process.env && process.env.NODE_ENV !== 'production') {
  // This flag allows us to disable HMR when we don't want reloads during
  // debugging.
  window.hmrEnabled = true;

  const fs = require('fs');
  fs.watch('./build/bundle.js', (event, filename) => {
    if (filename) {
      if (!window.hmrEnabled) {
        return console.log('HMR: Ignoring external changes.');
      }
      // console.log(`${filename} file Changed`);
      setTimeout(() => {
        // Webpack sometimes modifies files multiple times in a short span,
        // causing a broken reload. Wait a bit for it to finish.
        // Currently a bug in nw.js. TODO: remove once they fix it.
        // nw.Window.get().reload();
        chrome.tabs.reload()
      }, 250);
    }
  });
}

/* Main
/* --------------------------------- */

console.groupCollapsed(`Pre-init (build number: ${packageJson.releaseNumber}).`);

// Register all scenes.
for (let scene of scenes) {
  console.log('Registering scene', scene.name);
  scene.register();
}
// Register all camera controllers.
for (let ctrl of cameraControllers) {
  console.log('Registering cam controller', ctrl.name);
  ctrl.register();
}

console.groupEnd();

onDocumentReady(() => {
  // Glue it together, and start the rendering process.
  core.init({ sceneName: defaultScene });

  // Auto switch to hyperdrive for now because we do not yet have regular engines
  // going.
  // TODO: delete me.
  startupEmitter.on(startupEvent.ready, () => {
    api.triggerAction('toggleMousePointer');
    api.triggerAction('toggleMouseControl');
    api.triggerAction('engageHyperdrive');

    // Next to moon, good place to test lighting.
    // api.setPlayerShipLocation(new Vector3(390249080, 2468483, 5996841));
    // api.setPlayerShipRotation(new Vector3(2.5626, -1.2120, 2.6454));

    // Directly facing the moon, another good place to test lighting.
    api.setPlayerShipLocation(new Vector3(381752594, 691327, 1417254));
    api.setPlayerShipRotation(new Vector3(-2.5974, 1.3167, 2.1961));

    // Facing Earth with moon in view, back to sun.
    // api.setPlayerShipLocation(new Vector3(-26914792, 5727037, 5578466));
    // api.setPlayerShipRotation(new Vector3(0.8734, 1.5370, 1.6702));

    // Behind the Earth, shrouded in night. Used to make sure we're getting
    // shadows.
    // api.setPlayerShipLocation(new Vector3(12715908, 3376086, 3944229));
    // api.setPlayerShipRotation(new Vector3(2.3031, -1.1355, 0.7181));

    // Close to moon, good place to test overexposure.
    // api.setPlayerShipLocation(new Vector3(384046753, -938728, -2120968));
    // api.setPlayerShipRotation(new Vector3(0.2875, -0.0703, 0.0226));

    // On Earth's surface at night, facing moon.
    // api.setPlayerShipLocation(new Vector3(-26914792, 5727037, 5578466));
    // api.setPlayerShipRotation(new Vector3(0.8734, 1.5370, 1.6702));

    // Behind Earth. Useful for testing shadow casting, atmospheric lensing, etc.
    // api.setPlayerShipLocation(new Vector3(27656524, -835865, -766508));
    // api.setPlayerShipRotation(new Vector3(-0.1851, -1.5549, -0.0682));

    // Next to that crazy fucking huge fireball.
    // api.setPlayerShipLocation(new Vector3(-150064242871, -485401441, -392001660));
    // api.setPlayerShipRotation(new Vector3(-0.8526, -0.3184, -1.4681));
  });

  window.rootNode = ReactDOM.render(
    <RootNode />,
    document.getElementById('reactRoot'),
  );
});
