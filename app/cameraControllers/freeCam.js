import * as THREE from "three";

import { controls } from '../local/controls';
import core from "../local/core";
import speedTracker from "./utils/speedTracker";

const mode = core.modes.freeCam;

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let speed = 120 / 14.388; // 120KM/h

let doRender = false;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

let turnLeft = false;
let turnRight = false;
let turnUp = false;
let turnDown = false;
let spinLeft = false;
let spinRight = false;

let accelerate = false;
let decelerate = false;

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
            speedTracker.trackCameraSpeed();
        }
        else {
            speedTracker.clearSpeedTracker();
        }
    });
}

function onKeyUpDown({ key, amount, isDown }) {
    console.log('[freeCam] key:', key);
    const ctrl = controls.freeCam;
    if (ctrl.forward.includes(key)) {
        moveForward = isDown;
    }
    else if (ctrl.back.includes(key)) {
        moveBackward = isDown;
    }
    else if (ctrl.left.includes(key)) {
        moveLeft = isDown;
    }
    else if (ctrl.right.includes(key)) {
        moveRight = isDown;
    }
    else if (ctrl.up.includes(key)) {
        moveUp = isDown;
    }
    else if (ctrl.down.includes(key)) {
        moveDown = isDown;
    }
    else if (ctrl.turnLeft.includes(key)) {
        turnLeft = isDown;
    }
    else if (ctrl.turnRight.includes(key)) {
        turnRight = isDown;
    }
    else if (ctrl.turnUp.includes(key)) {
        turnUp = isDown;
    }
    else if (ctrl.turnDown.includes(key)) {
        turnDown = isDown;
    }
    else if (ctrl.spinLeft.includes(key)) {
        spinLeft = isDown;
    }
    else if (ctrl.spinRight.includes(key)) {
        spinRight = isDown;
    }
    else if (ctrl.speedUp.includes(key)) {
        accelerate = isDown;
    }
    else if (ctrl.speedDown.includes(key)) {
        decelerate = isDown;
    }
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

    if (accelerate) {
        speed += (delta * 200) + (speed * 0.01);
    }
    else if (decelerate) {
        speed -= (delta * 200) + (speed * 0.01);
        if (speed < 0) {
            speed = 0;
        }
    }

    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;
    velocity.y -= velocity.y * 10 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.y = Number(moveDown) - Number(moveUp);
    // This ensures consistent movements in all directions.
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * speed * 40.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * 40.0 * delta;
    if (moveUp || moveDown) velocity.y -= direction.y * speed * 40.0 * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateY(velocity.y * delta);
    camera.translateZ(velocity.z * delta);

    if (turnLeft) camera.rotateY( +delta * 1.5);
    if (turnRight) camera.rotateY( -delta * 1.5);
    if (turnUp) camera.rotateX( +delta * 1.5);
    if (turnDown) camera.rotateX(-delta * 1.5);
    if (spinLeft) camera.rotateZ(+delta * 1.5);
    if (spinRight) camera.rotateZ( -delta * 1.5);
}

export default {
    name: 'freeCam',
    register,
}
