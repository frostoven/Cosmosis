import * as THREE from "three";

import { controls } from '../local/controls';
import core from "../local/core";

const mode = core.modes.freeCam;

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let speed = 10;

let doRender = false;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let accelerate = false;
let decelerate = false;

function register() {
    core.registerCamControl({
        name: 'freeCam', render,
    });

    core.registerKeyUpDown({
        mode, cb: onKeyUpDown,
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
    else if (ctrl.speedUp.includes(key)) {
        accelerate = isDown;
        console.log('speed:', speed);
    }
    else if (ctrl.speedDown.includes(key)) {
        decelerate = isDown;
        console.log('speed:', speed);
    }
}

function render(delta) {
    const { scene, camera, renderer } = $gameView;

    // const time = performance.now();
    // if (ptrLockControls.isLocked) {
    // const { velocity, direction, moveForward, moveBackward, moveLeft, moveRight, moveDown, moveUp } = freeCam;
    // const delta = (time - prevTime) / 1000;

    if (accelerate) {
        speed += (delta * 1000) + (speed * 0.01);
    }
    else if (decelerate) {
        speed -= (delta * 1000) + (speed * 0.01);
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

    camera.position.x += (-velocity.x * delta);
    camera.position.y += (velocity.y * delta);
    camera.position.z += (velocity.z * delta);

    // moveRight(-velocity.x * delta);
    // moveForward(-velocity.z * delta);
    // getObject().position.y += (velocity.y * delta);

    // ptrLockControls.moveRight(-velocity.x * delta);
    // ptrLockControls.moveForward(-velocity.z * delta);
    // ptrLockControls.getObject().position.y += (velocity.y * delta);
    // }
    // prevTime = time;
}

export default {
    name: 'freeCam',
    register,
}
