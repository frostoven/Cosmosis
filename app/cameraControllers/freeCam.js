import * as THREE from "three";

import { controls } from '../local/controls';
import core from "../local/core";
import speedTracker from "./utils/speedTracker";

const mode = core.modes.freeCam;
const camControls = controls.freeCam;
let speedTimer = null;

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let speed = 120 / 14.388; // 120KM/h

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
}

function register() {
    core.registerCamControl({
        name: 'freeCam', render,
    });

    core.registerKeyUpDown({
        mode, cb: onKeyUpDown,
    });

    // Only render if mode is freeCam.
    core.registerModeListener((change) => {
        doRender = change.mode === mode;
        if (doRender) {
            speedTimer = speedTracker.trackCameraSpeed();
        }
        else if (speedTimer) {
            speedTracker.clearSpeedTracker(speedTimer);
        }
    });
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

    const { scene, camera, renderer } = $gameView;

    // const time = performance.now();
    // if (ptrLockControls.isLocked) {
    // const { velocity, direction, moveForward, moveBackward, moveLeft, moveRight, moveDown, moveUp } = freeCam;
    // const delta = (time - prevTime) / 1000;

    if (ctrl.speedUp) {
        speed += (delta * 200) + (speed * 0.01);
    }
    else if (ctrl.speedDown) {
        speed -= (delta * 200) + (speed * 0.01);
        if (speed < 0) {
            speed = 0;
        }
    }

    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;
    velocity.y -= velocity.y * 10 * delta;

    direction.z = Number(ctrl.moveForward) - Number(ctrl.moveBackward);
    direction.x = Number(ctrl.moveRight) - Number(ctrl.moveLeft);
    direction.y = Number(ctrl.moveDown) - Number(ctrl.moveUp);
    // This ensures consistent movements in all directions.
    direction.normalize();

    if (ctrl.moveForward || ctrl.moveBackward) velocity.z -= direction.z * speed * 40.0 * delta;
    if (ctrl.moveLeft || ctrl.moveRight) velocity.x -= direction.x * speed * 40.0 * delta;
    if (ctrl.moveUp || ctrl.moveDown) velocity.y -= direction.y * speed * 40.0 * delta;

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
