import * as THREE from "three";

import AssetLoader from '../local/AssetLoader';
import { controls } from '../local/controls';
import core from '../local/core';
import speedTracker from './utils/speedTracker';
import { lockModes } from '../local/PointerLockControls';

const mode = core.modes.freeCam;
const camControls = controls.freeCam;
let speedTimer = null;

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let speed = 10 / 14.388; // 10KM/h
// let speed = 120 / 14.388; // 120KM/h
// let speed = 25e6 / 14.388;

let doRender = false;

const ctrl = {
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
}

const toggles = {
    interact: () => $game.level.useNext(),
};

function register() {
    core.registerCamControl({ name: 'freeCam', render });
    core.registerKeyPress({ mode, cb: onKeyPress });
    core.registerKeyUpDown({ mode, cb: onKeyUpDown });

    // Only render if mode is freeCam.
    core.modeListeners.register((change) => {
        doRender = change.mode === mode;
        if (doRender) {
            // Set game lock only when the game is ready.
            core.onLoadProgress(core.progressActions.gameViewReady, () => {
                $game.ptrLockControls.setLockMode(lockModes.freeLook);
                AssetLoader.disableCrosshairs();
            });

            speedTimer = speedTracker.trackCameraSpeed();
        }
        else if (speedTimer) {
            speedTracker.clearSpeedTracker(speedTimer);
        }
    });
}


function onKeyPress({ key, amount }) {
    const control = camControls[key];
    if (!control) {
        // No control mapped for pressed button.
        return;
    }
    // Ex. 'interact'
    const toggleFn = toggles[control];
    if (toggleFn) {
        toggleFn();
    }
}

function onKeyUpDown({ key, amount, isDown }) {
    // console.log('[freeCam] key:', key, '->', camControls[key]);
    const control = camControls[key];
    if (!control) {
        // No control mapped for pressed button.
        return;
    }
    ctrl[control] = isDown;
}

function render(delta) {
    if (!doRender) {
        return;
    }

    const { scene, camera, renderer } = $game;

    if (ctrl.speedUp) {
        speed += (delta * 200) + (speed * 0.01);
    }
    else if (ctrl.speedDown) {
        speed -= (delta * 200) + (speed * 0.01);
        if (speed < 0) {
            speed = 0;
        }
    }
    const effSpeed = speed * (ctrl.doubleSpeed ? 2 : 1);

    // The rest of this function is for keyboard controls. Note that the mouse
    // is not handled in this function.

    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;
    velocity.y -= velocity.y * 10 * delta;

    direction.z = Number(ctrl.moveForward) - Number(ctrl.moveBackward);
    direction.x = Number(ctrl.moveRight) - Number(ctrl.moveLeft);
    direction.y = Number(ctrl.moveDown) - Number(ctrl.moveUp);
    // This ensures consistent movements in all directions.
    direction.normalize();

    if (ctrl.moveForward || ctrl.moveBackward) velocity.z -= direction.z * effSpeed * 40.0 * delta;
    if (ctrl.moveLeft || ctrl.moveRight) velocity.x -= direction.x * effSpeed * 40.0 * delta;
    if (ctrl.moveUp || ctrl.moveDown) velocity.y -= direction.y * effSpeed * 40.0 * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateY(velocity.y * delta);
    camera.translateZ(velocity.z * delta);

    if (ctrl.turnLeft) camera.rotateY( +delta * 1.5);
    if (ctrl.turnRight) camera.rotateY( -delta * 1.5);
    if (ctrl.lookUp) camera.rotateX( +delta * 1.5);
    if (ctrl.lookDown) camera.rotateX(-delta * 1.5);
    if (ctrl.spinLeft) camera.rotateZ(+delta * 1.5);
    if (ctrl.spinRight) camera.rotateZ( -delta * 1.5);
}

export default {
    name: 'freeCam',
    register,
}
