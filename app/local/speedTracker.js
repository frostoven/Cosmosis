/*
 * Debugging tool for tracking current player speed.
 */

import * as THREE from 'three';
import Unit from './Unit';

const au = Unit.au.inMeters;
const lightSpeed = Unit.lightSpeed.inMeters;

const { floor } = Math;
const radToDeg = THREE.MathUtils.radToDeg;

// How often we calculate distance. This is variable, change as needed.
let freq = 1000;
// Per second.  (i.e. per 1000 milliseconds). This is constant, don't change.
const perUnit = 1000;
// Used to calculate meters per second.
let prevPosition = new THREE.Vector3(0, 0, 0);
// If true, position will be displayed in AU instead of meters.
let useAu = false;
let useDegrees = false;
// If false, tracks spaceship speed and position relative to the local
// universe. If true, instead tracks camera relative to the ship center.
let trackCamera = false;

function showStats() {
  const statusDiv = document.getElementById('speed-tracker');
  if (statusDiv && statusDiv.style.display !== 'block') {
    setTimeout(() => {
      statusDiv.style.display = 'block';
      statusDiv.onclick = () => useDegrees = useAu = !useAu;
    }, 50);
  }
}

/**
 * Used to track camera speed. Gives visual feedback as a status bar.
 */
function trackCameraSpeed(warpBubble, camera) {
  return setInterval(() => {
    const statusDiv = document.getElementById('speed-tracker');
    if (!statusDiv) {
      // This sometimes happens right after the game has loaded.
      // TODO: hook this into the game loading process.
      console.log('Waiting for camera to become ready...');
      return;
    }
    showStats();

    let camPs;
    let camRt;
    if (trackCamera) {
      if (!camera) {
        return;
      }
      camPs = camera.position;
      camRt = camera.rotation;
    }
    else {
      camPs = warpBubble.position;
      camRt = warpBubble.rotation;
    }

    let dist = camPs.distanceTo(prevPosition);
    dist = dist / (freq / perUnit);

    // Positions.
    let psx = floor(camPs.x);
    let psy = floor(camPs.y);
    let psz = floor(camPs.z);

    // Convert / make pretty.
    if (useAu) {
      psx = formatComma(psx / au) + ' AU';
      psy = formatComma(psy / au) + ' AU';
      psz = formatComma(psz / au) + ' AU';
    }
    else {
      psx = formatComma(psx) + ' m';
      psy = formatComma(psy) + ' m';
      psz = formatComma(psz) + ' m';
    }

    let rx, ry, rz;
    if (useDegrees) {
      rx = radToDeg(camRt.x).toFixed(4) + ' °';
      ry = radToDeg(camRt.y).toFixed(4) + ' °';
      rz = radToDeg(camRt.z).toFixed(4) + ' °';
    }
    else {
      rx = camRt.x.toFixed(4);
      ry = camRt.y.toFixed(4);
      rz = camRt.z.toFixed(4);
    }

    statusDiv.textContent =
      formatComma(dist) + ' m/s ' +
      '[' + formatComma(dist * 3.6) + 'km/h' + '] ' +
      '<' + formatComma(dist / lightSpeed) + 'C>\n' +
      `{Ps} x:${psx}, y:${psy}, z:${psz}\n` +
      `{Rt} x:${rx}, y:${ry}, z:${rz}`;
    prevPosition.copy(camPs);
  }, freq);
}

/**
 * @param {number} number
 * @returns {string}
 */
function formatComma(number) {
  return number.toLocaleString(
    undefined,
    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
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

window.debug.speedTracker = function() {
};
window.debug.speedTracker.prototype = {
  get frequency() {
    return freq;
  },
  set frequency(v) {
    freq = v;
  },
  get trackCamera() {
    return trackCamera;
  },
  set trackCamera(v) {
    trackCamera = v;
  },
};
window.debug.speedTracker = new window.debug.speedTracker();

export default {
  trackCameraSpeed,
  clearSpeedTracker,
};
