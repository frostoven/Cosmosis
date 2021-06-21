import React from 'react';
import ControlsOverlay from './ControlsOverlay';
import ControlsMenuReadOnly from './ControlsMenuReadOnly';
import { getUiEmitter } from '../emitters';

const uiEmitter = getUiEmitter();

export default class RootNode extends React.Component {
  constructor(props) {
    super(props);
    // All the uiEmitter events this component will listen for.
    this.listensFor = [
      'toggleControlsMenuReadOnly',
    ];
    this.state = {
      showControlsMenuReadOnly: false,
    };
  }

  /**
   * Registers this class with uiEmitter.
   */
  registerEventListeners = () => {
    const events = this.listensFor;
    for (let i = 0, len = events.length; i < len; i++) {
      const event = events[i];
      // Example of what this looks like to the computer:
      //  uiEmitter.on('showControlsMenuReadOnly', this.showControlsMenuReadOnly);
      uiEmitter.on(event, this[event]);
    }
  };

  /**
   * Removes registrations for this class from uiEmitter.
   */
  removeEventListeners = () => {
    const events = this.listensFor;
    for (let i = 0, len = events.length; i < len; i++) {
      const event = events[i];
      // Example of what this looks like to the computer:
      //  uiEmitter.removeListener('showControlsMenuReadOnly', this.showControlsMenuReadOnly);
      uiEmitter.removeListener(event, this[event]);
    }
  };

  componentDidMount() {
    this.registerEventListeners();
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  toggleControlsMenuReadOnly = () => {
    this.setState({
      showControlsMenuReadOnly: !this.state.showControlsMenuReadOnly,
    });
  };

  render() {
    return (
      <div>
        <ControlsOverlay />
        <ControlsMenuReadOnly visible={this.state.showControlsMenuReadOnly} />
      </div>
    );
  }
}
