import * as THREE from "three";

import { controls } from './controls';

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

function onKeyUpDown({ key, isDown }) {
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
}

function animateFreeCam({ ptrLockControls }) {
    const time = performance.now();
    // if (ptrLockControls.isLocked) {
    // const { velocity, direction, moveForward, moveBackward, moveLeft, moveRight, moveDown, moveUp } = freeCam;
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= velocity.y * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.y = Number(moveDown) - Number(moveUp);
    // This ensures consistent movements in all directions.
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
    if (moveUp || moveDown) velocity.y -= direction.y * 400.0 * delta;

    ptrLockControls.moveRight(-velocity.x * delta);
    ptrLockControls.moveForward(-velocity.z * delta);
    ptrLockControls.getObject().position.y += (velocity.y * delta);
    // }
    prevTime = time;
}

export default {
    animateFreeCam,
    onKeyUpDown,
}
