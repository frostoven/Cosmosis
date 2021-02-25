/**
 * Fork of the default three.js PointerLockControls. This fork differs in that
 * it allows using the mouse as an analog device (for example, to control
 * things like thrust) without dictating it be used only as a camera mover.
 */

import { Euler, EventDispatcher, Quaternion, Vector3 } from 'three';

import { opacity as aimOpacity } from "./crosshairs";

const lockModes = {
  // Mouse does not cause the camera to move in this mode.
  // TODO: currently shows visuals too, please visuals move elsewhere.
  frozen: 2,
  // Can look freely in all directions without restriction.
  freeLook: 4,
  // Can look 110 degrees from origin before mouse stops moving.
  headLook: 8,
};

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
  // If true, the browser will hide the cursor.
  this.isPointerLocked = false;
  // Visually draws the crosshairs with html and css. TODO: move me elsewhere.
  this.enableCrosshairs = false;
  this.lockMode = lockModes.freeLook;

  // Set to constrain the pitch of the camera
  // Range is 0 to Math.PI radians
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // Constrain pitch in headlook mode.
  this.headXMax = 1565;
  this.headYMax = 1110;

  this.camRefQuat = null;
  this.mouseX = 100;
  this.mouseY = 100;

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
    if (scope.isPointerLocked === false) {
      return;
    }

    if (!scope.camRefQuat) {
      // This block is used if the camera is working independantly
      scope.mouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      scope.mouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      scope.updateIndependently();
    }
    else {
      // Headlook mode. Used when the camera is locked to i.e. the bridge cam.
      const mx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const my = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      if (Math.abs(scope.mouseX + mx) < scope.headXMax) {
        scope.mouseX += mx;
      }
      if (Math.abs(scope.mouseY + my) < scope.headYMax) {
        scope.mouseY += my;
      }
    }

    scope.dispatchEvent(changeEvent);
  }

  function onPointerlockChange() {
    if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
      scope.dispatchEvent(lockEvent);
      scope.isPointerLocked = true;
    } else {
      scope.dispatchEvent(unlockEvent);
      scope.isPointerLocked = false;
    }
  }

  function onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
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

  // Locks the mouse pointer.
  this.lock = function () {
    this.domElement.requestPointerLock();
  };

  // Unlocks the mouse pointer.
  this.unlock = function () {
    scope.domElement.ownerDocument.exitPointerLock();
  };

  // Locks or unlocks the mouse pointer.
  this.toggle = function () {
    if (this.isPointerLocked) {
      this.unlock();
    } else {
      this.lock();
    }
  }

  this.getLockMode = function() {
    return this.lockMode;
  }

  // Sets the lock mode and undoes any external quaternion references.
  this.setLockMode = function(mode) {
    this.resetCamRefQuat();
    this.lockMode = mode;
  }

  this.setCamRefQuat = function (quaternion) {
    this.camRefQuat = quaternion;
    this.updateWithRef();
  }

  this.updateIndependently = function () {
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= scope.mouseX * 0.002;
    euler.x -= scope.mouseY * 0.002;
    euler.x = Math.max(PI_2 - scope.maxPolarAngle, Math.min(PI_2 - scope.minPolarAngle, euler.x));
    camera.quaternion.setFromEuler(euler);
  }

  this.updateWithRef = function () {
    camera.quaternion.copy(scope.camRefQuat);
    camera.rotateY(scope.mouseX * -0.002);
    camera.rotateX(scope.mouseY * -0.002);
  }

  this.getCamRefQuat = function () {
    return this.camRefQuat;
  }

  this.resetCamRefQuat = function () {
    this.camRefQuat = null;
  }

  // TODO: move this to a better place.
  this.toggleCrosshairs = function () {
    scope.enableCrosshairs = !scope.enableCrosshairs;
    if (scope.enableCrosshairs) {
      aimOpacity('aimCenter', 0.25);
    }
    else {
      aimOpacity('aimCenter', 0);
    }
  }
  //
  // TODO: move this to a better place.
  this.showCrosshairs = function () {
    scope.enableCrosshairs = true;
    aimOpacity('aimCenter', 0.25);
  }
  //
  // TODO: move this to a better place.
  this.hideCrosshairs = function () {
    scope.enableCrosshairs = false;
    aimOpacity('aimCenter', 0);
  }

  this.connect();
};

PointerLockControls.prototype = Object.create( EventDispatcher.prototype );
PointerLockControls.prototype.constructor = PointerLockControls;

export {
  PointerLockControls,
  lockModes,
};
