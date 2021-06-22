/* Loads special HTML elements
 * ---------------------------------
 * Most (if not all) of these may need to be replaced with better solutions in
 * future.
 *
 * Probably the only feature that should remain here is the splash screen.
 */

const fs = require('fs');

import packageJson from '../../package.json';
import { loadAllCrosshairImages } from './crosshairs';

let windowHasLoaded = false;
const callbacks = [];

/**
 * Polyfill for running nw.js code in the browser.
 */
if (!process) {
  console.warn(
    'Process object not available; polyfilling. Note that this is currently untested.'
  );
  process = {
    nextTick: (cb) => setTimeout(cb, 0),
    env: {
      NODE_ENV: 'production',
    },
  };
}

/**
 * Queues callback to run after window.onload completes. If window.onload has
 * already completed, callback is called immediately.
 * @param callback
 * @returns {*}
 */
export default function onDocumentReady(callback) {
  if (windowHasLoaded) {
    return callback();
  }
  callbacks.push(callback);
}

/**
 * Notifies all queued onDocumentReady listeners, then sets a flag indicating this is done.
 */
function notifyListenersAndStop() {
  if (windowHasLoaded) {
    return console.error(
      'notifyListenersAndStop called after window load process has completed.',
    );
  }
  windowHasLoaded = true;
  for (let i = 0, len = callbacks.length; i < len; i++) {
    const cb = callbacks[i];
    cb();
  }
}

function windowLoadListener(readyCb=()=>{}) {
  // Loading text
  const loadingTextDiv = document.getElementById('loading-text');
  const build = packageJson.releaseNumber;
  if (loadingTextDiv) {
    loadingTextDiv.innerHTML = `Cosmosis build ${build}<br>Loading...<br>`;
    fs.access('prodHqAssets', (error) => {
      if (error) {
        loadingTextDiv.innerHTML =
          `Cosmosis build ${build}<br>` +
          'NOTE: high quality assets folder missing.<br>' +
          'Loading...<br>';
      }
    });
  }
  else {
    console.warn('Could not find #loading-text div.');
  }

  // Crosshairs
  // TODO: these should be moved to a better place.
  const crosshairsDiv = document.getElementById('crosshairs');
  if (crosshairsDiv) {
    loadAllCrosshairImages(crosshairsDiv);
  }
  else {
    console.error('Could not find #crosshairs div.');
  }

  notifyListenersAndStop();
}

window.onload = windowLoadListener;
