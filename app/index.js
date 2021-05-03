import './local/windowLoadListener';
import React from 'react';

import core from './local/core';
import powerOnSelfTest from './test';
import api from './local/api';
import build from '../build.json';
import packageJson from '../package.json';

// Game modules.
import scenes from './scenes';
import cameraControllers from './cameraControllers';
import './local/toast';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { Vector3 } from 'three';

// Debug reference to three.
window.$THREE = THREE;
// Debug reference to cannon.
window.$CANNON = CANNON;
// Debug reference to API.
window.$API = api;

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
        nw.Window.get().reload();
      }, 250);
    }
  });

  // This should probably done with a CI pipeline or some automated process in
  // future, but for now we do it here to easily keep things cross platform:
  // keep package.json version up to date with build number.
  const version = `0.${build.buildNumber}.0`;
  if (packageJson.version !== version) {
    console.log('=> Update version number in package.json <=');
    packageJson.version = version;
    fs.writeFile('./package.json', JSON.stringify(packageJson, null, 2), (error) => {
      if (error) {
        console.error('Could not update package.json to match build version.');
      }
    });
  }
}

/* Main
/* --------------------------------- */

console.groupCollapsed(`Pre-init (build number: ${build.buildNumber}).`);

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

// Glue it together, and start the rendering process.
core.init({ sceneName: defaultScene });

// Auto switch to hyperdrive for now because we do not yet have regular engines
// going.
// TODO: delete me.
core.startupEmitter.on(core.startupEvent.ready, () => {
  api.triggerAction('toggleMousePointer');
  api.triggerAction('toggleMouseControl');
  api.triggerAction('engageHyperdrive');
  // Close to moon, good place to test lighting.
  api.setPlayerShipLocation(new Vector3(390249080, 2468483, 5996841));
  api.setPlayerShipRotation(new Vector3(2.5626, -1.2120, 2.6454));
})

class Hud extends React.Component {
  // static propTypes = {};
  // static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // core.registerGlobalAction({
    // 	action: 'changeSceneTo',
    // 	item: {
    // 		boxScene: () => { this.setState({ activeScene: BoxScene }) },
    // 		spaceScene: () => { this.setState({ activeScene: SpaceScene }) },
    // 	}
    // });
  }

  componentWillUnmount() {
    // core.deregisterGlobalAction({ action: 'changeSceneTo' });
  }

  render() {
    // const ActiveScene = this.state.activeScene;
    return (
      <div>
        root div
      </div>
    );
  }
}

// window.rootNode = ReactDOM.render(
// 	<Hud />,
// 	document.getElementById('reactRoot')
// );
