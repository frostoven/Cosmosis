import React from 'react';
import ControlsOverlay from './ControlsOverlay';
import ControlsMenuReadOnly from './ControlsMenuReadOnly';
import Menu from './Menu';

export default class RootNode extends React.Component {
  render() {
    return (
      <div>
        <ControlsOverlay />
        {/*<ControlsMenuReadOnly visible={this.state.showControlsMenuReadOnly} />*/}
        <ControlsMenuReadOnly visible={false} /> {/* TODO: delete this. */}
        <Menu />
      </div>
    );
  }
}
