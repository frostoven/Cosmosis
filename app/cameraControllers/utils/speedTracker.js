/*
 * Visually tracks current camera speed.
 */

import * as THREE from "three";

// Used to calculate meters per second.
let speedMeterTimer = null;
let prevPosition = new THREE.Vector3( 0, 0, 0 );

// Speed of light in a vacuum. Obviously.
const C = 299792458;

/**
 * Used to track camera speed. Gives visual feedback as a status bar.
 */
function trackCameraSpeed() {
  if (!$gameView.camera) {
    // This sometimes happens right after the game has loaded.
    console.log('Waiting for camera to become ready...');
    return setTimeout(trackCameraSpeed, 10);
  }

  const statusDiv = document.getElementById('camDevArea');
  if (!speedMeterTimer) {
    statusDiv.style.display = 'block';
  }

  const camPosition = $gameView.camera.position;
  prevPosition.copy(camPosition);
  speedMeterTimer = setInterval(() => {
    const dist = camPosition.distanceTo(prevPosition);
    // if (dist !== 0) {
    //   console.log(dist);
    // }
    statusDiv.innerText =
      dist.toFixed(1) + ' m/s ' +
      '[' + (dist * 3.6).toFixed(1) + 'km/h' + '] ' +
      '<' + (dist / C).toFixed(1) + 'C>';
    prevPosition.copy(camPosition);
  }, 1000);
}

/*
 * Stops tracking camera speed.
 */
function clearSpeedTracker() {
  if (!speedMeterTimer) {
    return;
  }
  clearInterval(speedMeterTimer);
  document.getElementById('camDevArea').style.display = 'none';
}

export default {
  trackCameraSpeed,
  clearSpeedTracker,
};
