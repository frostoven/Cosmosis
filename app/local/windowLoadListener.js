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

import userProfile from '../userProfile';
import packageJson from '../../package.json';

let windowHasLoaded = false;
let bootReadySignalled = false;
const onDocReadyCallbacks = new CbQueue();
const onBootReadyCallbacks = new CbQueue();
// The amount of times notifyListenersAndStop needs to be called for document
// ready can be triggered.
const eventsNeededToContinue = 2;
// The amount of times notifyListenersAndStop has been called.
let eventCount = 0;
// Messages sent to #boot-logger before the DOM was ready.
const bootMessageQueue = [];

/**
 * Polyfill for running nw.js code in the browser.
 */
if (!process) {
  console.warn(
    'Process object not available; polyfilling. Note that this is currently untested.',
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
 * completed. If those have already fired, callback is called immediately.
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

function windowLoadListener(readyCb = () => {
}) {
  windowHasLoaded = true;
  onDocReadyCallbacks.notifyAll();
  renderBootMessages();

  // Start profile init.
  userProfile.init(() => {
    notifyListenersAndStop();
  });

  // Loading text
  const loadingTextDiv = document.getElementById('loading-text');
  const build = packageJson.version;
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

  notifyListenersAndStop();
}

function renderBootMessages() {
  const bootDiv = document.getElementById('boot-log');
  if (bootDiv) {
    bootDiv.innerHTML =
      bootMessageQueue.slice(-24).join('<br/>') +
      '<br/>' +
      '<div class="blinky">_</div>';
    bootDiv.scrollIntoView({ block: 'center', inline: 'center' });
  }
}

function bootLogger({ text = '', isError = false, reuseIndex }) {
  if (!text) {
    return;
  }

  if (isError) {
    text = `<div style="color: red; display: inline">${text}</div>`;
  }

  if (reuseIndex > -1) {
    bootMessageQueue[reuseIndex] = text;
  }
  else {
    bootMessageQueue.push(text);
  }

  renderBootMessages();
}

/**
 * Logs a message and returns its index.
 * @param {string} text
 * @param {boolean} [includeConsoleLog]
 * @param {number} [reuseIndex] - The index of the message to replace. -1 means
 *  "add a new message." Default is -1.
 * @return {number}
 */
export function logBootInfo(text, includeConsoleLog = false, reuseIndex = -1) {
  bootLogger({ text, reuseIndex });
  if (includeConsoleLog) {
    console.log(text);
  }
  return bootMessageQueue.length - 1;
}

/**
 * Logs a message and returns its index.
 * @param title
 * @param {string} text
 * @param {number} [reuseIndex] - The index of the message to replace. -1 means
 *  "add a new message." Default is -1.
 * @return {number}
 */
export function logBootTitleAndInfo(
  title, text, reuseIndex = -1,
) {
  bootLogger({
    text: `* [<div style="display: inline; color: greenyellow">${title}]</div> ${text}`,
    reuseIndex,
  });
  return bootMessageQueue.length - 1;
}

/**
 * Logs an error and returns its index.
 * @param {string} text
 * @param {boolean} [includeConsoleLog]
 * @param {number} [reuseIndex] - The index of the message to replace. -1 means
 *  "add a new message." Default is -1.
 * @return {number}
 */
export function logBootError(text, includeConsoleError = false, reuseIndex = -1) {
  bootLogger({ text, isError: true, reuseIndex });
  if (includeConsoleError) {
    console.error(text);
  }
  return bootMessageQueue.length - 1;
}

export function closeBootWindow() {
  const bootLog = document.getElementById('boot-log');
  if (bootLog) {
    bootLog.classList.add('splash-fade-out');
    setTimeout(() => {
      // Needed to prevent the boot log from invisibly interfering with stuff.
      bootLog.style.display = 'none';
    }, 750);
  }
}

window.onload = windowLoadListener;
