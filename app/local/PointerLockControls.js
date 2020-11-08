/**
 * Fork of the default three.js PointerLockControls. This fork differs in that
 * it allows using the mouse as an analog device (for example, to control
 * things like thrust) without dictating it be used only as a camera mover.
 */

import { Euler, EventDispatcher, Vector3 } from 'three';

import { opacity as aimOpacity } from "./crosshairs";

const PointerLockControls = function (camera, domElement, onMouseCb) {
  if (domElement === undefined) {
    console.warn(
      'SpaceJunkie PointerLockControls: The second parameter "domElement" is now mandatory.'
    );
    domElement = document.body;
  }
  if (!onMouseCb) {
    onMouseCb = () => {};
  }

  this.domElement = domElement;
  this.isLocked = false;
  this.isCamLocked = true;

  // Set to constrain the pitch of the camera
  // Range is 0 to Math.PI radians
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  //
  // internals
  //

  const scope = this;

  const changeEvent = {type: 'change'};
  const lockEvent = {type: 'lock'};
  const unlockEvent = {type: 'unlock'};

  const vec = new Vector3();
  const euler = new Euler(0, 0, 0, 'YXZ');
  const PI_2 = Math.PI / 2;

  function onMouseMove(event) {
    if (scope.isLocked === false) {
      return;
    }

    const mouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const mouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    if (!scope.isCamLocked) {
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= mouseX * 0.002;
      euler.x -= mouseY * 0.002;
      euler.x = Math.max(PI_2 - scope.maxPolarAngle, Math.min(PI_2 - scope.minPolarAngle, euler.x));
      camera.quaternion.setFromEuler(euler);
    }
    else {
      onMouseCb(mouseX, mouseY);
    }

    scope.dispatchEvent(changeEvent);
  }

  function onPointerlockChange() {
    if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
      scope.dispatchEvent(lockEvent);
      scope.isLocked = true;
    } else {
      scope.dispatchEvent(unlockEvent);
      scope.isLocked = false;
    }
    scope.lockChange();
  }

  function onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
    scope.lockChange();
  }

  this.connect = function () {
    scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove, false);
    scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.disconnect = function () {
    scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove, false);
    scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.dispose = function () {

    this.disconnect();

  };

  this.getObject = function () { // retaining this method for backward compatibility
    return camera;
  };

  this.getDirection = function () {
    const direction = new Vector3(0, 0, -1);
    return function (v) {
      return v.copy(direction).applyQuaternion(camera.quaternion);
    };
  }();

  this.moveForward = function (distance) {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up
    vec.setFromMatrixColumn(camera.matrix, 0);
    vec.crossVectors(camera.up, vec);
    camera.position.addScaledVector(vec, distance);

  };

  this.moveRight = function (distance) {
    vec.setFromMatrixColumn(camera.matrix, 0);
    camera.position.addScaledVector(vec, distance);
  };

  this.lock = function () {
    this.domElement.requestPointerLock();
  };

  this.unlock = function () {
    scope.domElement.ownerDocument.exitPointerLock();
  };

  this.toggle = function () {
    if (this.isLocked) {
      this.unlock();
    } else {
      this.lock();
    }
  }

  this.lockCamera = function () {
    this.isCamLocked = true;
    this.lockChange();
  }

  this.unlockCamera = function () {
    this.isCamLocked = false;
    this.lockChange();
  }

  this.toggleCamLock = function () {
    if (this.isLocked) {
      scope.isCamLocked = !scope.isCamLocked;
      scope.lockChange();
    }
  }

  this.lockChange = function () {
    if (scope.isLocked && scope.isCamLocked) {
      aimOpacity('aimCenter', 0.25);
    }
    else {
      aimOpacity('aimCenter', 0);
    }
  }

  this.connect();
};

PointerLockControls.prototype = Object.create( EventDispatcher.prototype );
PointerLockControls.prototype.constructor = PointerLockControls;

export { PointerLockControls };
