import ReactDOM from 'react-dom';
import React, { Suspense } from 'react';
import { Canvas } from 'react-three-fiber';
import * as THREE from 'three';

import core from './local/core';
import BoxScene from './scenes/BoxScene';
import SpaceScene from './scenes/SpaceScene';
import Effects from './scenes/components/Effects';

import PhysicsBox from './models/PhysicsBox';
import PlayerShip from './models/PlayerShip';
import {Provider} from "./local/useCannon";

/* Main
/* --------------------------------- */

class Game extends React.Component {
	// static propTypes = {};
	// static defaultProps = {};

	constructor(props) {
		super(props);
		this.state = {
			activeScene: BoxScene,
			physics: null,
		};
	}

	componentDidMount() {
		// core.getPhysicsInst((physics) => {
		// 	this.setState({ physics });
		// });
		core.registerGlobalAction({
			action: 'changeSceneTo',
			item: {
				boxScene: () => { this.setState({ activeScene: BoxScene }) },
				spaceScene: () => { this.setState({ activeScene: SpaceScene }) },
			}
		});
	}

	componentWillUnmount() {
		// core.deregisterGlobalAction({ action: 'changeSceneTo' });
	}

	render() {
		// if (!this.state.physics) {
		// 	return (
		// 		<h1 style={{
		// 			position: 'fixed',
		// 			color: '#ffa5a5',
		// 			textAlign: 'center',
		// 			left: 0,
		// 			right: 0,
		// 			bottom: '50%'
		// 		}}>Loading physics engine...</h1>
		// 	)
		// }

		const ActiveScene = this.state.activeScene;
		return (
			<Canvas
				style={{
					position: 'fixed',
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
				}}
				onCreated={(items) => {
					console.log('onCreated:', items);
					core.initCanvas(items);
					items.gl.toneMapping = THREE.ACESFilmicToneMapping
					// items.gl.outputEncoding = THREE.sRGBEncoding
				}}>
			>
				<ActiveScene />
				<Suspense fallback={null}>
					<Provider>
						<PhysicsBox position={[1, 0, -10]} />
						<PlayerShip position={[1, 0, -9]}/>
						<PlayerShip position={[0, -1, 0]} rotation={[ 0, 3, 0 ]} />
					</Provider>
				</Suspense>
				<Effects />
			</Canvas>
		);
	}
}

window.rootNode = ReactDOM.render(
	<Game />,
	document.getElementById('root')
);

/**
 * Used for easy console debugging. Please do not use this line in actual code.
 */
window.gameCore = core;
