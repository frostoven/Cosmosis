/*
 * Visually tracks current camera speed.
 */

/*
 * TODO:
 *  consider doing the following.
 *  top, mid, bottom bar.
 *  top bar: c, ALWAYS 6 chars regardless.
 *  mid: MM/s
 *  bottom: m/s up to 10, then km/s. bottom scales font smaller as value gets bigger.
 */

import * as THREE from "three";

// Used to calculate meters per second.
let prevPosition = new THREE.Vector3( 0, 0, 0 );

// Speed of light in a vacuum. Obviously.
const C = 299792458;

function showStats() {
  const statusDiv = document.getElementById('speed-tracker');
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
  // How often we calculate distance. This is variable, change as needed.
  const freq = 1000;
  // Per second.  (i.e. per 1000 milliseconds). This is constant, don't change.
  const perUnit = 1000;

  return setInterval(() => {
    $game.playerShip.getOnce((playerShip) => {
      const statusDiv = document.getElementById('speed-tracker');
      if (!statusDiv) {
        // This sometimes happens right after the game has loaded.
        // TODO: hook this into the game loading process.
        console.log('Waiting for camera to become ready...');
        return;
      }
      showStats();

      const camPs = playerShip.warpBubble.position;
      const camRt = playerShip.warpBubble.rotation;

      let dist = camPs.distanceTo(prevPosition);
      dist = dist / (freq / perUnit);

      statusDiv.innerText =
        formatSpeed(dist) + ' m/s ' +
        '[' + formatSpeed(dist * 3.6) + 'km/h' + '] ' +
        '<' + formatSpeed(dist / C) + 'C>\n' +
        `{Ps} x:${Math.floor(camPs.x)}, y:${Math.floor(camPs.y)}, z:${Math.floor(camPs.z)}\n` +
        `{Rt} x:${camRt.x.toFixed(4)}, y:${camRt.y.toFixed(4)}, z:${camRt.z.toFixed(4)}`;
      prevPosition.copy(camPs);
    });
  }, freq);
}

/**
 * @param {number} number
 * @returns {string}
 */
function formatSpeed(number) {
  return number.toLocaleString(
    undefined,
    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
  );
}

/*
 * Stops tracking camera speed.
 */
function clearSpeedTracker(timer) {
  if (!timer) {
    console.error('clearSpeedTracker needs a timer.');
    return;
  }
  const statusDiv = document.getElementById('speed-tracker');
  if (statusDiv) {
    statusDiv.style.display = 'none';
  }
  clearInterval(timer);
}

export default {
  trackCameraSpeed,
  clearSpeedTracker,
};
