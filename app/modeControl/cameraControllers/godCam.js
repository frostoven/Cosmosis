/*
 * Provides a camera controller than zooms out at many times the speed of
 * light.
 */

import * as THREE from 'three';

import core from '../../local/core';
import speedTracker from '../../local/speedTracker';
import contextualInput from '../../local/contextualInput';
import { getStartupEmitter, startupEvent } from '../../emitters';

const { camController, ActionType } = contextualInput;
const godCamMode = camController.enroll('godCam');

const startupEmitter = getStartupEmitter();

let controllerActive = false;
let mouse = [ 0.5, 0.5 ];
let zoomPos = 1; //-100;
let minZoomSpeed = .015;
let zoomSpeed = minZoomSpeed;

let speedTimer = null;

const toggles = {
  //
};

function init() {
  core.registerRenderHook({
    name: 'godCam', render,
  });

  // Key down actions.
  camController.onActions({
    actionType: ActionType.keyUp | ActionType.keyDown,
    actionNames: [ 'zoomIn', 'zoomOut' ],
    modeName: godCamMode,
    callback: onMouseWheel,
  });

  // Key press actions.
  camController.onActions({
    actionType: ActionType.keyPress,
    actionNames: Object.keys(toggles), // all presses handled by godCam
    modeName: godCamMode,
    callback: onKeyPress,
  });

  // Analog actions.
  camController.onActions({
    actionType: ActionType.analogMove,
    actionNames: [ 'pitchUp', 'pitchDown', 'yawLeft', 'yawRight' ],
    modeName: godCamMode,
    callback: onAnalogInput,
  });

  camController.onControlChange(({ next, previous }) => {
    if (next === godCamMode) {
      console.log('-> mode changed to', godCamMode);
      controllerActive = true;
      zoomPos = 1;
      zoomSpeed = minZoomSpeed;
      startupEmitter.on(startupEvent.gameViewReady, () => {
        $game.camera.position.x = 0;
        $game.camera.position.y = 0;
        $game.camera.position.z = 0;
        speedTimer = speedTracker.trackCameraSpeed();
      });
    }
    else if (previous === godCamMode && speedTimer) {
      controllerActive = false;
      speedTracker.clearSpeedTracker(speedTimer);
    }
  });
}

function render(delta) {
  if (!controllerActive) {
    return;
  }

  const { spaceScene, camera, renderer } = $game;

  // Put some limits on zooming
  // const minZoom = labelData[0].size * labelData[0].scale * 1;
  // const maxZoom = labelData[labelData.length - 1].size * labelData[labelData.length - 1].scale * 100;
  // TODO: investigate if we can do this without hardcoding here.
  const minZoom = 0.01 * 0.0001;
  const maxZoom = 1e19 * 100;

  let damping = (Math.abs(zoomSpeed) > minZoomSpeed ? 0.95 : 1.0);
  // This works, but has strange side-effects (very slow / fast) if FPS changes
  // drastically in small period of time. No current plans to fix as this is
  // only meant to be a dev tool for now.
  damping *= delta * $stats.getFps();

  // Zoom out faster the further out you go.
  const zoom = THREE.MathUtils.clamp(Math.pow(Math.E, zoomPos), minZoom, maxZoom);
  zoomPos = Math.log(zoom);

  // Slow down quickly at the zoom limits
  if ((zoom == minZoom && zoomSpeed < 0) || (zoom == maxZoom && zoomSpeed > 0)) {
    damping = .85 * delta * $stats.getFps();
  }

  zoomPos += zoomSpeed;
  zoomSpeed *= damping;

  camera.position.x = Math.sin(.5 * Math.PI * (mouse[0] - .5)) * zoom;
  camera.position.y = Math.sin(.25 * Math.PI * (mouse[1] - .5)) * zoom;
  camera.position.z = Math.cos(.5 * Math.PI * (mouse[0] - .5)) * zoom;
  camera.lookAt(spaceScene.position);
}

function onMouseWheel({ action, isDown }) {
  // const dir = amount / Math.abs(amount);
  let dir = 1;
  if (action === 'zoomIn') {
    dir = -1;
  }
  zoomSpeed = dir / 10;
  // Slow down default zoom speed after user starts zooming, to give the user
  // more control.
  minZoomSpeed = 0.001;
}

function onKeyPress({ action }) {
  // Ex. 'toggleMouseSteering' or 'toggleMousePointer' etc.
  const toggleFn = toggles[action];
  if (toggleFn) {
    toggleFn();
  }
}

function onAnalogInput({ analogData }) {
  // TODO: we have a bug here where camera does not move for some reason.
  //  Guessing it's locked to something somewhere, but unsure. Leaving it for
  //  now as it still achieves its primary function of zooming out very far.
  const mouse = core.userMouseSpeed(analogData.x.delta, analogData.y.delta);
  mouse[0] = mouse.x;
  mouse[1] = mouse.y;
}

export default {
  init,
}
