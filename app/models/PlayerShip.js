import React, { useRef } from 'react';

import core from '../local/core';
import { controls } from '../local/controls';
import Ship from './Ship';
import BoxScene from "../scenes/BoxScene";

const {
  modes, getMode, setMode, registerModeListener, deregisterModeListener,
  registerKeyPress, deregisterKeyPress, registerKeyUpDown, deregisterKeyUpDown,
} = core;

export default class PlayerShip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  onUpdate = ({ model }) => {
    const cam1 = model.nodes.BridgeCam1;
  }

  componentDidMount() {
    registerModeListener(this.onModeChange);
    registerKeyUpDown({ mode: modes.shipPilot, cb: this.onKeyUpDown });
  }

  componentWillUnmount() {
    deregisterModeListener(this.onModeChange);
    deregisterKeyUpDown({ mode: modes.shipPilot, cb: this.onKeyUpDown });
  }

  onKeyUpDown = ({ key, isDown }) => {
    // console.log(`Player ship: key=${key}, isDown=${isDown}`);
    const ctrl = controls.shipPilot;
    if (ctrl.thrustInc.includes(key)) {
      console.log('Player ship: increase thrust.');
    }
    else if (ctrl.thrustDec.includes(key)) {
      console.log('Player ship: decrease thrust.');
    }
  };

  onModeChange = ({ mode, prevMode }) => {
    console.log(`Detected mode change: mode=${mode}, prevMode=${prevMode}`);
  }

  render() {
    return (
      <Ship
        {...this.props}
        model="DS69F"
        onUpdate={this.onUpdate}
      />
    )
  }
}
