import ReactDOM from 'react-dom';
import React, { Suspense } from 'react';
import powerOnSelfTest from './test';
// import { Canvas } from 'react-three-fiber';
// import * as THREE from 'three';

import core from './local/core';

// Game modules.
import scenes from './scenes';
import cameraControllers from './cameraControllers';

const defaultScene = 'logDepthDemo';

// Integration tests. Note that these won't actually by itself. The user
// manually runs these by opening the dev console and entering
// 'powerOnSelfTest()'.
window.powerOnSelfTest = powerOnSelfTest;

// import core from './local/core';
// import BoxScene from './scenes/BoxScene';
// import SpaceScene from './scenes/SpaceScene';
// import Effects from './scenes/components/Effects';
//
// import PhysicsBox from './models/PhysicsBox';
// import PlayerShip from './models/PlayerShip';
// import Ship from './models/Ship';
// import {Provider} from "./local/useCannon";

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
core.init(defaultScene);

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
