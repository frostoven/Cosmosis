import React from 'react';
import ControlsOverlay from './ControlsOverlay';
import Menu from './Menu';

export default class RootNode extends React.Component {
  render() {
    return (
      <div>
        <Menu />
      </div>
    );
  }
}
