/*
 * Visually tracks current camera speed.
 */

import * as THREE from "three";

// Used to calculate meters per second.
let speedMeterTimer = null;
let prevPosition = new THREE.Vector3( 0, 0, 0 );

// Speed of light in a vacuum. Obviously.
const C = 299792458;

function showStats() {
  const statusDiv = document.getElementById('camDevArea');
  if (statusDiv && statusDiv.style.display !== 'block') {
    setTimeout(() => {
      statusDiv.style.display = 'block';
    }, 50);
  }
}

/**
 * Used to track camera speed. Gives visual feedback as a status bar.
 */
function trackCameraSpeed() {
  const timer = setInterval(() => {
    const statusDiv = document.getElementById('camDevArea');
    if (!statusDiv || !$gameView.camera) {
      // This sometimes happens right after the game has loaded.
      console.log('Waiting for camera to become ready...');
      return;
    }
    showStats();

    const camPs = $gameView.camera.position;
    const camRt = $gameView.camera.rotation;

    const dist = camPs.distanceTo(prevPosition);
    // if (dist !== 0) {
    //   console.log(dist);
    // }
    statusDiv.innerText =
      dist.toFixed(1) + ' m/s ' +
      '[' + (dist * 3.6).toFixed(1) + 'km/h' + '] ' +
      '<' + (dist / C).toFixed(1) + 'C>\n' +
      `{Ps} x:${Math.floor(camPs.x)}, y:${Math.floor(camPs.y)}, z:${Math.floor(camPs.z)}\n` +
      `{Rt} x:${camRt.x.toFixed(4)}, y:${camRt.y.toFixed(4)}, z:${camRt.z.toFixed(4)}`;
    prevPosition.copy(camPs);
  }, 1000);

  return timer;
}

/*
 * Stops tracking camera speed.
 */
function clearSpeedTracker(timer) {
  if (!timer) {
    console.error('clearSpeedTracker needs a timer.');
    return;
  }
  const statusDiv = document.getElementById('camDevArea');
  if (statusDiv) {
    statusDiv.style.display = 'none';
  }
  clearInterval(timer);
}

export default {
  trackCameraSpeed,
  clearSpeedTracker,
};
