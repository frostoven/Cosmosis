/* Loads special HTML elements
 * ---------------------------------
 * Most (if not all) of these may need to be replaced with better solutions in
 * future.
 *
 * Probably the only features that should remain here are the splash screen and
 * doc-ready functions.
 */

import CbQueue from './CbQueue';
const fs = require('fs');

import userProfile from '../userProfile'
import packageJson from '../../package.json';
import { loadAllCrosshairImages } from './crosshairs';

let windowHasLoaded = false;
let bootReadySignalled = false;
const onDocReadyCallbacks = new CbQueue();
const onBootReadyCallbacks = new CbQueue();
// The amount of times notifyListenersAndStop needs to be called for document
// ready can be triggered.
const eventsNeededToContinue = 2;
// The amount of times notifyListenersAndStop has been called.
let eventCount = 0;

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
 * Queues callback to run after both window.onload completes and pre-boot has
 * completed. If those has already fired, callback is called immediately.
 * @param callback
 * @returns {*}
 */
export function onReadyToBoot(callback) {
  if (bootReadySignalled) {
    return callback();
  }
  onBootReadyCallbacks.register(callback);
}

// Called during window.onload.
export function onDocumentReady(callback) {
  if (windowHasLoaded) {
    return callback();
  }
  onDocReadyCallbacks.register(callback);
}

/**
 * If eventCount is >= eventsNeededToContinue, then this function notifies all
 * queued onReadyToBoot listeners, then sets a flag indicating this is done.
 * Otherwise it does nothing.
 */
function notifyListenersAndStop() {
  if (++eventCount < eventsNeededToContinue) {
    return;
  }

  if (bootReadySignalled) {
    return console.error(
      'notifyListenersAndStop called after boot process has started.',
    );
  }
  bootReadySignalled = true;
  onBootReadyCallbacks.notifyAll();
}

function windowLoadListener(readyCb=()=>{}) {
  windowHasLoaded = true;
  onDocReadyCallbacks.notifyAll();

  // Start profile init.
  userProfile.init(() => {
    notifyListenersAndStop();
  });

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

export default {
  onReadyToBoot,
  onDocumentReady,
}
