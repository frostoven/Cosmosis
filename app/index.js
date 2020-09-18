import ReactDOM from 'react-dom';
import React, { Suspense } from 'react';
import { Canvas } from 'react-three-fiber';

import core from './local/core';
import BoxScene from './scenes/BoxScene';
import SpaceScene from './scenes/SpaceScene';
import Effects from './scenes/components/Effects';

import Ship from './models/Ship';

/* Main
/* --------------------------------- */

class Game extends React.Component {
	static propTypes = {};
	static defaultProps = {};

	constructor(props) {
		super(props);
		this.state = {
			activeScene: BoxScene
		};
	}

	componentDidMount() {
		core.registerGlobalAction({
			action: 'changeSceneTo',
			item: {
				boxScene: () => { this.setState({ activeScene: BoxScene }) },
				spaceScene: () => { this.setState({ activeScene: SpaceScene }) },
			}
		})
	}

	componentWillUnmount() {
		core.deregisterGlobalAction({ action: 'changeSceneTo' });
	}

	render() {
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
				}}>
			>
				<ActiveScene />
				<Suspense fallback={null}>
					<Ship />
				</Suspense>
				<Effects />
			</Canvas>
		);
	}
}

window.rootNode = ReactDOM.render(
	<Game />,
	document.getElementById('root')
)
