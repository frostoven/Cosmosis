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

// const mode = core.modes.freeCam;
// const camControls = controls.freeCam;
let speedTimer = null;

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let speed = 10 / 14.388; // 10KM/h
// let speed = 120 / 14.388; // 120KM/h
// let speed = 25e6 / 14.388;

let controllerActive = false;

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

function init() {
    core.registerRenderHook({ name: 'freeCam', render });

    // Key down actions.
    camController.onActions({
        actionType: ActionType.keyUp | ActionType.keyDown,
        actionNames: Object.keys(ctrl), // all controls handled by freeCam
        modeName: freeCamMode,
        callback: onKeyUpOrDown,
    });

    // Key press actions.
    camController.onActions({
        actionType: ActionType.keyPress,
        actionNames: Object.keys(toggles), // all presses handled by freeCam
        modeName: freeCamMode,
        callback: onKeyPress,
    });

    // Analog actions.
    camController.onActions({
        actionType: ActionType.analogMove,
        actionNames: [ 'pitchUp', 'pitchDown', 'yawLeft', 'yawRight' ],
        modeName: freeCamMode,
        callback: onAnalogInput,
    });

    camController.onControlChange(({ next, previous }) => {
        // Only render if mode is freeCam.
        if (next === freeCamMode) {
            console.log('-> mode changed to', freeCamMode);
            controllerActive = true;
            // Set game lock only when the game is ready.
            startupEmitter.on(startupEvent.gameViewReady, () => {
                $game.ptrLockControls.setLockMode(lockModes.freeLook);
                AssetLoader.disableCrosshairs();
            });
            speedTimer = speedTracker.trackCameraSpeed();
        }
        else if (previous === freeCamMode && speedTimer) {
            controllerActive = false;
            speedTracker.clearSpeedTracker(speedTimer);
        }
    });
}


function onKeyPress({ action }) {
    // console.log('[freeCam 1] key press:', action);
    // Ex. 'toggleMouseSteering' or 'toggleMousePointer' etc.
    const toggleFn = toggles[action];
    if (toggleFn) {
        toggleFn();
    }
}

function onKeyUpOrDown({ action, isDown }) {
    // console.log('[freeCam 2] key:', action, '->', isDown ? '(down)' : '(up)');
    ctrl[action] = isDown;
}

function onAnalogInput({ analogData }) {
    const mouse = core.userMouseSpeed(analogData.x.delta, analogData.y.delta);
    $game.ptrLockControls.onMouseMove(mouse.x, mouse.y);
}

function render(delta) {
    if (!controllerActive) {
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
    init,
}

