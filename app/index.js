import ReactDOM from 'react-dom';
import React from 'react';
import { Canvas } from 'react-three-fiber';

import globals from './local/globals';
import BoxScene from './scenes/BoxScene';
import SpaceScene from './scenes/SpaceScene';

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
		globals.registerGlobalAction({
			action: 'changeSceneTo',
			item: {
				boxScene: () => { this.setState({ activeScene: BoxScene }) },
				spaceScene: () => { this.setState({ activeScene: SpaceScene }) },
			}
		})
	}

	componentWillUnmount() {
		globals.deregisterGlobalAction({ action: 'changeSceneTo' });
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
			>
				<ActiveScene />
			</Canvas>
		);
	}
}

window.rootNode = ReactDOM.render(
	<Game />,
	document.getElementById('react-element')
)
