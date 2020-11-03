import React, { useRef } from 'react';
import { useFrame, useThree } from 'react-three-fiber';

import core from '../local/core';
import { controls } from '../local/controls';
import Ship from './Ship';
import BoxScene from "../scenes/BoxScene";

const {
  modes, getMode, setMode, registerModeListener, deregisterModeListener,
  registerKeyPress, deregisterKeyPress, registerKeyUpDown, deregisterKeyUpDown,
} = core;

/**
 * Unsure how to use r3f hooks in normal components, so just wrapping for now.
 * @param {object} props
 * @returns {number[] | SamplingHeapProfileNode[] | NodeJS.Module[] | HTMLCollection}
 * @constructor
 */
function PlayerController(props) {
  props.useThree(useThree());
  useFrame(props.useFrame);
  return props.children;
}

export default class PlayerShip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    // If true, does initial setup on first animation frame.
    this.doInit = true;
    // The ship we're currently in.
    this.shipModel = null;
    // The position our camera is currently tracking.
    this.camTarget = null;
    // The camera our screen is following.
    this.sceneCam = null;

    this.thrust = 0;
    this.thrustDelta = 1;
    this.incThrust = false;
    this.decThrust = false;
    this.resetThrust = false;
  }

  onShipUpdate = ({ model }) => {
    this.shipModel = model;
    // this.camTarget = model.nodes.BridgeCam1;
    this.camTarget = model.nodes.maintenance_cover;
  };

  componentDidMount() {
    registerModeListener(this.onModeChange);
    registerKeyUpDown({ mode: modes.shipPilot, cb: this.onKeyUpDown });
  }

  componentWillUnmount() {
    deregisterModeListener(this.onModeChange);
    deregisterKeyUpDown({ mode: modes.shipPilot, cb: this.onKeyUpDown });
  }

  setContexts = (contexts) => {
    this.sceneCam = contexts.camera;
  };

  onKeyUpDown = ({ key, isDown }) => {
    // console.log(`Player ship: key=${key}, isDown=${isDown}`);
    const ctrl = controls.shipPilot;
    if (ctrl.thrustInc.includes(key)) {
      // console.log('Player ship: increase thrust.');
      this.incThrust = isDown;
    }
    else if (ctrl.thrustDec.includes(key)) {
      // console.log('Player ship: decrease thrust.');
      this.decThrust = isDown;
    }
    else if (ctrl.thrustReset.includes(key)) {
      // Always reset
      this.resetThrust = true;
    }
  };

  onModeChange = ({ mode, prevMode }) => {
    console.log(`Detected mode change: mode=${mode}, prevMode=${prevMode}`);
  }

  animate = (state, deltaTime) => {
    if (this.doInit) {
      if (this.camTarget) {
        this.doInit = false;
        // this.camTarget.attach(this.sceneCam);
        console.log('scene cam:', this.sceneCam);
        setTimeout(() => {
          console.log('cam target:', this.camTarget);
        }, 2000);
      }
    }
    this.lockCameraTo(this.camTarget);

    if (this.incThrust) {
      this.thrust += this.thrustDelta * deltaTime;
      // console.log('Thrust is:', this.thrust);
    }
    if (this.decThrust) {
      this.thrust -= this.thrustDelta * deltaTime;
      // console.log('Thrust is:', this.thrust);
    }
    if (this.resetThrust) {
      this.resetThrust = false;
      this.thrust = 0;
      // console.log('Thrust is:', this.thrust);
    }
  };

  lockCameraTo = (cam) => {
    if (this.camTarget && this.sceneCam) {
      this.sceneCam.position.copy(this.camTarget.position);

      // this.sceneCam.updateProjectionMatrix();
      // this.sceneCam.position.x = this.camTarget.position.x;
      // this.sceneCam.position.y = this.camTarget.position.y;
      // this.sceneCam.position.z = this.camTarget.position.z;
    }
  };

  // increaseThrust = (deltaTime) => {
  //   this.thrust += this.thrustDelta;
  // };
  //
  // decreaseThrust = (deltaTime) => {
  //   this.thrust -= this.thrustDelta;
  // };

  resetThrust = () => {
    this.thrust = 0;
  };

  render() {
    return (
      <PlayerController useThree={this.setContexts} useFrame={this.animate}>
        <Ship
          {...this.props}
          model="DS69F"
          onUpdate={this.onShipUpdate}
        />
      </PlayerController>
    )
  }
}
