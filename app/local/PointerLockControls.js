
/**
 * Fork of the default three.js PointerLockControls. This fork differs in that
 * it allows using the mouse as an analog device (for example, to control
 * things like thrust) without dictating it be used only as a camera mover.
 */

import { Euler, EventDispatcher } from 'three';

import contextualInput from './contextualInput';
import { getStartupEmitter, startupEvent } from '../emitters';

const startupEmitter = getStartupEmitter();

const lockModes = {
  // Mouse does not cause the camera to move in this mode.
  frozen: 2,
  // Can look freely in all directions without restriction.
  freeLook: 4,
  // Can look 110 degrees from origin before mouse stops moving.
  headLook: 8,
};

const PointerLockControls = function (camera, domElement) {
  if (domElement === undefined) {
    console.warn(
      'PointerLockControls: The second parameter "domElement" is now mandatory.'
    );
    domElement = document.body;
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

  // When true, the pressing of the Escape button is simulated when pointerlock
  // is lost. This is needed because we cannot intercept (or even detect) if
  // the user presses escape to exit pointer lock. This is a problem because we
  // use escape for pause menus etc. See onPointerlockChange below.
  this.simulateNextEscape = true;

  //
  // internals
  //

  const scope = this;

  const changeEvent = {type: 'change'};
  const lockEvent = {type: 'lock'};
  const unlockEvent = {type: 'unlock'};

  const euler = new Euler(0, 0, 0, 'YXZ');
  const PI_2 = Math.PI / 2;

  // function onMouseMove(event) {
  function onMouseMove(mx, my) {
    // if (scope.isPointerLocked === false) {
    //   return;
    // }

    // Headlook mode. Used when the camera is locked to i.e. the bridge cam.
    // const mx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    // const my = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    if (scope.lockMode === lockModes.headLook) {
      // Limit how far the player can turn their necks.
      if (Math.abs(scope.mouseX + mx) < scope.headXMax) {
        scope.mouseX += mx;
      }
      if (Math.abs(scope.mouseY + my) < scope.headYMax) {
        scope.mouseY += my;
      }
    }
    else {
      // Allow fracturing of vertebrae.
      scope.mouseX += mx;
      scope.mouseY += my;
    }

    scope.dispatchEvent(changeEvent);
  }

  function mockEscapeEvent() {
    return {
      code: 'Escape',
    };
  }

  function onPointerlockChange() {
    if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
      scope.dispatchEvent(lockEvent);
      scope.isPointerLocked = true;
    } else {
      scope.dispatchEvent(unlockEvent);
      scope.isPointerLocked = false;

      // If the mouse is locked and the user presses Escape, pointerlock is
      // automatically released and, annoying, no Escape key is triggered despite
      // the user having pressed Escape. So instead we'll simulate it. It is the
      // responsibility of reality controllers to temporarily disable
      // 'simulateNextEscape' when pressing a key other than escape to exit
      // pointerlock. We also have to check if the document has focus, because
      // alt-tabbing will also trigger pointerlock releases.
      // TODO: experiment with hiding cursor instead and auto locking as soon
      //  as allowed by having the system try a lock() every few milliseconds
      //  if that's the current expected state (i.e. a Ctrl press should abort
      //  that attempt).
      if (document.hasFocus() && scope.simulateNextEscape) {
        // console.log('---> PRESS AND RELEASE ESCAPE.')
        contextualInput.ContextualInput.universalEventListener({
          code: 'Escape', type: 'keydown',
        });
        contextualInput.ContextualInput.universalEventListener({
          code: 'Escape', type: 'keyup',
        });
      }
      scope.simulateNextEscape = true;
    }
    // console.log('isPointerLocked:', scope.isPointerLocked);
  }

  function onPointerlockError() {
    // Only throw error if game is fully loaded and we have focus.
    startupEmitter.on(startupEvent.ready, () => {
      if (document.hasFocus()) {
        console.error(
          'THREE.PointerLockControls: Unable to use Pointer Lock API. This ' +
          'could be because the window doesn\'t have focus, or because ' +
          'we\'re attempting a re-lock too soon after the browser forcibly ' +
          'exited lock.'
        );
      }
    });
  }

  // Expose event function to outside. This allows us to centralise even
  // management. I tried simply making this a prototype, but EventDispatcher
  // gave me strange errors. If you read this and want to refactor into a
  // prototype, feel free to do so.
  scope.onMouseMove = onMouseMove;
  // scope.onPointerlockChange = onPointerlockChange;
  // scope.onPointerlockError = onPointerlockError;
  // contextualInput.pointerLock.onAction({
  //   actionName: '',
  //   actionType: ActionType.pointerlockchange | ActionType.pointerlockerror,
  // });

  this.connect = function () {
    // scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove, false);
    scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.disconnect = function () {
    // scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove, false);
    scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.dispose = function () {
    // this.disconnect();
    console.warn(
      'ptrLockControls tried calling dispose, but this is unexpected. Please investigate.'
    );
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
    scope.simulateNextEscape = false;
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

PointerLockControls.prototype = Object.create(EventDispatcher.prototype);
PointerLockControls.prototype.constructor = PointerLockControls;

export {
  PointerLockControls,
  lockModes,
};
