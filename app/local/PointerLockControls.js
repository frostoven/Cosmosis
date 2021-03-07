/**
 * Fork of the default three.js PointerLockControls. This fork differs in that
 * it allows using the mouse as an analog device (for example, to control
 * things like thrust) without dictating it be used only as a camera mover.
 */

import { Euler, EventDispatcher, Quaternion, Vector3 } from 'three';

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
  this.lockMode = lockModes.freeLook;

  // Set to constrain the pitch of the camera
  // Range is 0 to Math.PI radians
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // Constrain pitch in headlook mode.
  this.headXMax = 1565;
  this.headYMax = 1110;

  // 0 here actually means center of the screen.
  this.mouseX = 0;
  this.mouseY = 0;

  //
  // internals
  //

  const scope = this;

  const changeEvent = {type: 'change'};
  const lockEvent = {type: 'lock'};
  const unlockEvent = {type: 'unlock'};

  const euler = new Euler(0, 0, 0, 'YXZ');
  const PI_2 = Math.PI / 2;

  function onMouseMove(event) {
    if (scope.isPointerLocked === false) {
      return;
    }

    // Headlook mode. Used when the camera is locked to i.e. the bridge cam.
    const mx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const my = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    if (scope.lockMode === lockModes.headLook) {
      if (Math.abs(scope.mouseX + mx) < scope.headXMax) {
        scope.mouseX += mx;
        scope.waitingX = mx;
      }
      if (Math.abs(scope.mouseY + my) < scope.headYMax) {
        scope.mouseY += my;
      }
    }
    else {
      scope.mouseX += mx;
      scope.mouseY += my;
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
  };

  this.getLockMode = function() {
    return this.lockMode;
  }

  // Sets the lock mode and undoes any external quaternion references.
  this.setLockMode = function(mode) {
    this.lockMode = mode;
  };

  // Updates camera angle relative to parent.
  this.updateOrientation = function () {
    let x = scope.mouseX;
    let y = scope.mouseY;
    if (scope.lockMode === lockModes.frozen) {
      // This is intentional - only want mouse to fire if ptr lock isn't using
      // it (i.e. frozen).
      onMouseCb(x, y);
      x = y = 0;
    }
    euler.setFromQuaternion(camera.quaternion);
    euler.y = x * -0.002;
    euler.x = y * -0.002;
    euler.x = Math.max(PI_2 - scope.maxPolarAngle, Math.min(PI_2 - scope.minPolarAngle, euler.x));
    camera.quaternion.setFromEuler(euler);
  }

  // Sets mouse to center of screen.
  this.resetMouse = function() {
    this.mouseX = 0;
    this.mouseY = 0;
  }

  this.connect();
};

PointerLockControls.prototype = Object.create( EventDispatcher.prototype );
PointerLockControls.prototype.constructor = PointerLockControls;

export {
  PointerLockControls,
  lockModes,
};
