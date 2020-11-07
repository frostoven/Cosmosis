import React from 'react';

import core from './local/core';
import { loadAllCrosshairImages } from "./local/crosshairs";
import powerOnSelfTest from './test';

// Game modules.
import scenes from './scenes';
import cameraControllers from './cameraControllers';
import './local/toast';

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
}

/* Main
/* --------------------------------- */

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

// Glue it together, and start the rendering process.
core.init({
  sceneName: defaultScene,
  // pos: new THREE.Vector3(0, 0, 0),
  // rot: new THREE.Vector3(0, 0, 0),
});

// Load special HTML elements.
window.onload = function() {
  const crosshairsDiv = document.getElementById('crosshairs');
  if (crosshairsDiv) {
    loadAllCrosshairImages(crosshairsDiv);
  }
  else {
    console.error('Could not find #crosshairs div.');
  }
}

// Temp dev overrides. Remove these eventually.
setTimeout(() => {
  core.triggerAction('toggleMousePointer');

  setTimeout(() => {
    core.triggerAction('toggleMouseControl');
    setTimeout(() => {
      core.triggerAction('_devChangeMode');
    }, 1200)
  }, 300);
}, 500);

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
