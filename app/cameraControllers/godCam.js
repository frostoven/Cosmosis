/*
 * Provides a camera controller than zooms out at many times the speed of
 * light.
 */

import * as THREE from 'three';

import core from '../local/core';
import { controls } from '../local/controls';
import speedTracker from "./utils/speedTracker";

const mode = core.modes.godCam;

let doRender = false;
let mouse = [ 0.5, 0.5 ];
let zoomPos = 1; //-100;
let minZoomSpeed = .015;
let zoomSpeed = minZoomSpeed;

const ctrl = controls.godCam;

function register() {
  core.registerCamControl({
    name: 'godCam', render,
  });

  core.registerKeyPress({
    mode, cb: onMouseWheel,
  });

  // Only render if mode is godCam.
  core.registerModeListener((change) => {
    doRender = change.mode === mode;
    if (doRender) {
      speedTracker.trackCameraSpeed();
    }
    else {
      speedTracker.clearSpeedTracker();
    }
  });

  core.registerAnalogListener({ mode, cb: onMouseMove });
}

function render(delta) {
  if (!doRender) {
    return;
  }

  const { scene, camera, renderer } = $gameView;

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
  camera.lookAt(scene.position);
}

function onMouseWheel({ key, amount, isDown }) {
  console.log(key)
  if (key !== 'spScrollUp' && key !== 'spScrollDown') {
    // Exclude keyboard events.
    return;
  }

  const dir = amount / Math.abs(amount);
  zoomSpeed = dir / 10;
  // Slow down default zoom speed after user starts zooming, to give the user
  // more control.
  minZoomSpeed = 0.001;
}

function onMouseMove(key, xAbs, yAbs) {
  mouse[0] = xAbs / window.innerWidth;
  mouse[1] = yAbs / window.innerHeight;
}

export default {
  name: 'godCam',
  register,
}
