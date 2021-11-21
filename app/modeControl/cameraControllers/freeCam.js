import * as THREE from "three";

import AssetLoader from '../../local/AssetLoader';
import core from '../../local/core';
import speedTracker from '../../local/speedTracker';
import { lockModes } from '../../local/PointerLockControls';
import { startupEvent, getStartupEmitter } from '../../emitters';
import contextualInput from '../../local/contextualInput';

const { camController, ActionType } = contextualInput;
const freeCamMode = camController.enroll('freeCam');

const startupEmitter = getStartupEmitter();

const SPEED_UNIT = 14.388;

let controllerActive = false;

function FreeCam(options={}) {
  this.modeName = freeCamMode;
  this.setDefaultValues();
  this.initNavigationValues();
  this.setControlActions();

  // Apply any overrides specified.
  for (const property in options) {
    if (options.hasOwnProperty(property)) {
      this[property] = options[property];
      // ^^ Example of what this looks like to the computer:
      //      this['something'] = options['something'];
    }
  }
}

FreeCam.prototype.setDefaultValues = function setDefaultValues() {
  this.velocity = new THREE.Vector3();
  this.direction = new THREE.Vector3();
  // The cam free-flight speed. You can calculate this speed in km/h using the
  // formula "desired_speed / SPEED_UNIT". So, 120km/h would be
  // "speed = 120 / SPEED_UNIT". Default speed is 10km/h. Also see methods
  // getSpeedKmh and setSpeedKmh, which manage these details for you.
  this.speed = 10 / SPEED_UNIT; // 10KM/h
  // TODO: This really needs a better solution. It will become a problem soon.
  this.speedTimer = null;
};

FreeCam.prototype.initNavigationValues = function initNavigationValues() {
  this.ctrl = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    //
    turnLeft: false,
    turnRight: false,
    lookUp: false,
    lookDown: false,
    spinLeft: false,
    spinRight: false,
    //
    speedUp: false,
    speedDown: false,
    doubleSpeed: false,
  };
};

FreeCam.prototype.setControlActions = function initNavigationValues() {
  this.toggles = {
    interact: () => $game.level.useNext(),
  };
};

FreeCam.prototype.registerKeyListeners = function registerKeyListeners() {
  // Key down actions.
  camController.onActions({
    actionType: ActionType.keyUp | ActionType.keyDown,
    actionNames: Object.keys(this.ctrl), // all controls handled by freeCam
    modeName: freeCamMode,
    callback: (args) => this.onKeyUpOrDown(args),
  });

  // Key press actions.
  camController.onActions({
    actionType: ActionType.keyPress,
    actionNames: Object.keys(this.toggles), // all presses handled by freeCam
    modeName: freeCamMode,
    callback: (args) => this.onKeyPress(args),
  });

  // Analog actions.
  camController.onActions({
    actionType: ActionType.analogMove,
    actionNames: [ 'pitchUp', 'pitchDown', 'yawLeft', 'yawRight' ],
    modeName: freeCamMode,
    callback: (args) => this.onAnalogInput(args),
  });
};

FreeCam.prototype.onControlChange = function freeCamControlChange({ next, previous }) {
  // Only render if mode is freeCam.
  if (next === freeCamMode) {
    console.log('-> mode changed to', freeCamMode);
    controllerActive = true;
    // Set game lock only when the game is ready.
    startupEmitter.on(startupEvent.gameViewReady, () => {
      $game.ptrLockControls.setLockMode(lockModes.freeLook);
      AssetLoader.disableCrosshairs();
    });
    this.speedTimer = speedTracker.trackCameraSpeed();
  }
  else if (previous === freeCamMode && this.speedTimer) {
    controllerActive = false;
    speedTracker.clearSpeedTracker(this.speedTimer);
  }
};

FreeCam.prototype.onKeyPress = function onKeyPress({ action }) {
  // console.log('[freeCam 1] key press:', action);
  // Ex. 'toggleMouseSteering' or 'toggleMousePointer' etc.
  const toggleFn = this.toggles[action];
  if (toggleFn) {
    toggleFn();
  }
};

FreeCam.prototype.onKeyUpOrDown = function onKeyUpOrDown({ action, isDown }) {
  // console.log('[freeCam 2] key:', action, '->', isDown ? '(down)' : '(up)');
  this.ctrl[action] = isDown;
};

FreeCam.prototype.onAnalogInput = function onAnalogInput({ analogData }) {
  const mouse = core.userMouseSpeed(analogData.x.delta, analogData.y.delta);
  $game.ptrLockControls.onMouseMove(mouse.x, mouse.y);
};

/**
 * Returns current free-flight cam in km/h.
 * @returns {number}
 */
FreeCam.prototype.getSpeedKmh = function setSpeedKm() {
  return this.speed * SPEED_UNIT;
};

/**
 * Sets current free-flight cam in km/h.
 * @returns {number}
 */
FreeCam.prototype.setSpeedKmh = function setSpeedKm(speed) {
  this.speed = speed / SPEED_UNIT;
};

FreeCam.prototype.step = function step({ delta }) {
  if (!controllerActive) {
    // This is an optimisation: all the below math is pointless if this
    // controller is not active. Removing this check, functionally, produces
    // the same result, but lowers performance.
    return;
  }

  const { camera, renderer } = $game;

  if (this.ctrl.speedUp) {
    this.speed += (delta * 200) + (this.speed * 0.01);
  }
  else if (this.ctrl.speedDown) {
    this.speed -= (delta * 200) + (this.speed * 0.01);
    if (this.speed < 0) {
      this.speed = 0;
    }
  }
  const effSpeed = this.speed * (this.ctrl.doubleSpeed ? 2 : 1);

  // The rest of this function is for keyboard controls. Note that the mouse
  // is not handled in this function.

  this.velocity.x -= this.velocity.x * 10 * delta;
  this.velocity.z -= this.velocity.z * 10 * delta;
  this.velocity.y -= this.velocity.y * 10 * delta;

  this.direction.z = Number(this.ctrl.moveForward) - Number(this.ctrl.moveBackward);
  this.direction.x = Number(this.ctrl.moveRight) - Number(this.ctrl.moveLeft);
  this.direction.y = Number(this.ctrl.moveDown) - Number(this.ctrl.moveUp);
  // This ensures consistent movements in all directions.
  this.direction.normalize();

  if (this.ctrl.moveForward || this.ctrl.moveBackward) this.velocity.z -= this.direction.z * effSpeed * 40.0 * delta;
  if (this.ctrl.moveLeft || this.ctrl.moveRight) this.velocity.x -= this.direction.x * effSpeed * 40.0 * delta;
  if (this.ctrl.moveUp || this.ctrl.moveDown) this.velocity.y -= this.direction.y * effSpeed * 40.0 * delta;

  camera.translateX(-this.velocity.x * delta);
  camera.translateY(this.velocity.y * delta);
  camera.translateZ(this.velocity.z * delta);

  if (this.ctrl.turnLeft) camera.rotateY(+delta * 1.5);
  if (this.ctrl.turnRight) camera.rotateY(-delta * 1.5);
  if (this.ctrl.lookUp) camera.rotateX(+delta * 1.5);
  if (this.ctrl.lookDown) camera.rotateX(-delta * 1.5);
  if (this.ctrl.spinLeft) camera.rotateZ(+delta * 1.5);
  if (this.ctrl.spinRight) camera.rotateZ(-delta * 1.5);
};

export {
  FreeCam,
  SPEED_UNIT,
}
