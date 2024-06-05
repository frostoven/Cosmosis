/**
 * Fork of the default three.js PointerLockControls. This fork differs in that
 * it allows using the mouse as an analog device (for example, to control
 * things like thrust) without dictating that it should only be used to move
 * the camera.
 */

import { Euler, EventDispatcher } from 'three';

// If the attempt to disable mouse acceleration crashes, this is automatically
// set to false. Linux currently does not support this flag.
let attemptToDisableMouseAcceleration = true;

if (process.platform === 'linux') {
  // I cry.
  attemptToDisableMouseAcceleration = false;
}

const PointerLockControls = function(domElement) {
  if (domElement === undefined) {
    console.warn(
      'PointerLockControls: The second parameter "domElement" is now mandatory.',
    );
    domElement = document.body;
  }

  this.domElement = domElement;
  // If true, the browser will hide the cursor.
  this.isPointerLocked = false;

  // When true, the pressing of the Escape button is simulated when pointerlock
  // is lost. This is needed because we cannot intercept (or even detect) if
  // the user presses escape to exit pointer lock. This is a problem because we
  // use escape for pause menus etc. See onPointerlockChange below.
  // TODO: reimplement - this currently has no effect.
  this.simulateNextEscape = true;

  const scope = this;

  const changeEvent = { type: 'change' };
  const lockEvent = { type: 'lock' };
  const unlockEvent = { type: 'unlock' };

  const euler = new Euler(0, 0, 0, 'YXZ');
  const PI_2 = Math.PI / 2;

  function onPointerlockChange() {
    if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
      scope.dispatchEvent(lockEvent);
      scope.isPointerLocked = true;
    }
    else {
      scope.dispatchEvent(unlockEvent);
      scope.isPointerLocked = false;
      scope.simulateNextEscape = true;
    }
  }

  function onPointerlockError() {
    // Only throw error if game is fully loaded and we have focus.
    if (document.hasFocus()) {
      console.error(
        'THREE.PointerLockControls: Unable to use Pointer Lock API. This ' +
        'could be because the window doesn\'t have focus, or because ' +
        'we\'re attempting a re-lock too soon after the browser forcibly ' +
        'exited lock.',
      );
    }
  }

  this.connect = function() {
    scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.disconnect = function() {
    scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.dispose = function() {
    // this.disconnect();
    console.warn(
      'ptrLockControls tried calling dispose, but this is unexpected. Please investigate.',
    );
  };

  // Locks the mouse pointer.
  this.lock = function() {
    // This convoluted mess exists to try to disable mouse acceleration. The
    // means to do so is non-standard, so we need to try methods that work for
    // all known rendering engines.
    if (attemptToDisableMouseAcceleration) {
      // Note: Chrome returns a promise, and we currently use NW.js
      // exclusively. This is non-standard, but allows for a far better gaming
      // experience.
      const promise = this.domElement.requestPointerLock({
        unadjustedMovement: true,
      });

      promise.catch(() => {
        // Pointer lock has failed; platform probably doesn't support the
        // unadjustedMovement flag.
        attemptToDisableMouseAcceleration = false;
        // Retry the lock.
        this.lock();
      });
    }
    else {
      this.domElement.requestPointerLock();
    }
  };

  // Unlocks the mouse pointer.
  this.unlock = function() {
    scope.simulateNextEscape = false;
    scope.domElement.ownerDocument.exitPointerLock();
  };

  // Locks or unlocks the mouse pointer.
  this.toggle = function() {
    if (this.isPointerLocked) {
      this.unlock();
    }
    else {
      this.lock();
    }
  };

  this.connect();
};

PointerLockControls.prototype = Object.create(EventDispatcher.prototype);
PointerLockControls.prototype.constructor = PointerLockControls;

export {
  PointerLockControls,
};
