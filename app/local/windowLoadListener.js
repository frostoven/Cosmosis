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

const MAX_TERM_LINES = 20;

const FIRMWARE_HEADER = [
  [ '╔════════════════════════════════════╗' ],
  [ '║ MicroECI Universal Spacecraft BIOS ║' ],
  [ '╟────────────────────────────────────╢' ],
  [ '║  Copyright (c) EarthGov Corp 2378  ║' ],
  [ '╚════════════════════════════════════╝' ],
];

let shipConsoleVisible = true;
let showFakeLegalNotice = false;
let disableCategoryGrouping = false;
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
const bootMessageQueue = [ ...FIRMWARE_HEADER ];

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

  const groupToggleButton = document.getElementById('group-toggle');
  const noticeToggleButton = document.getElementById('notice-toggle');
  if (groupToggleButton && noticeToggleButton) {
    groupToggleButton.onclick = () => {
      disableCategoryGrouping = !disableCategoryGrouping;
      renderBootMessages();
    };
    noticeToggleButton.onclick = () => {
      showFakeLegalNotice = !showFakeLegalNotice;
      renderBootMessages();
    };
  }
  else {
    console.error('Could not configure ship console buttons.');
  }

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
  const consoleDiv = document.getElementById('system-output');
  const groupToggleButton = document.getElementById('group-toggle');

  if (groupToggleButton) {
    const groupIcon = disableCategoryGrouping ? '◇' : '◈';
    groupToggleButton.textContent = `Group ${groupIcon}`;
  }

  if (showFakeLegalNotice) {
    consoleDiv.innerHTML = [
      ...FIRMWARE_HEADER,
      'Please be advised that, by decree of The EarthGov Corporation ' +
      'dated September 11, 2381, operating any spacecraft without ' +
      'official government-approved firmware is illegal.<br><br>' +
      'Violations are ' +
      'punishable by up to 40 years in a prison labor camp.',
    ].join('<br>');
    return;
  }

  if (consoleDiv) {
    let messages;
    if (disableCategoryGrouping) {
      messages = bootMessageQueue.slice(-MAX_TERM_LINES).flat();
    }
    else {
      messages = bootMessageQueue
        .slice(-MAX_TERM_LINES).map((divs) => divs[divs.length - 1]);
    }

    messages = messages.slice(-MAX_TERM_LINES).join('<br>');

    const elements = [
      messages,
      '<br>',
      '<div class="blinky">_</div>',
    ];
    consoleDiv.innerHTML = elements.join('');
    consoleDiv.scrollIntoView({ block: 'center', inline: 'center' });
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
    if (bootMessageQueue[reuseIndex]) {
      bootMessageQueue[reuseIndex].push([ text ]);
    }
    else {
      bootMessageQueue[reuseIndex] = [ text ];
    }
  }
  else {
    bootMessageQueue.push([ text ]);
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
    text: `◆ [<div style="display: inline; color: greenyellow">${title}</div>] ${text}`,
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

// If forceClose is true, the window will close even if the user appears busy.
export function closeBootWindow(forceClose = false) {
  if (!forceClose && (disableCategoryGrouping || showFakeLegalNotice)) {
    return;
  }
  shipConsoleVisible = false;
  const shipConsole = document.getElementById('ship-console');
  if (shipConsole) {
    shipConsole.classList.remove('fadeInRight');
    shipConsole.classList.add('fadeOutLeft');
    setTimeout(() => {
      // We need to double-check bootWindowVisible as the user may override it.
      if (!shipConsoleVisible) {
        // Needed to prevent the boot log from invisibly interfering with stuff.
        shipConsole.style.display = 'none';
      }
    }, 750);
  }
}

export function showBootWindow() {
  shipConsoleVisible = true;
  const shipConsole = document.getElementById('ship-console');
  if (shipConsole) {
    shipConsole.classList.remove('fadeOutLeft');
    shipConsole.classList.add('fadeInRight');
    shipConsole.style.display = 'block';
  }
}

export function toggleBootWindow(forceClose = false) {
  if (!forceClose && (disableCategoryGrouping || showFakeLegalNotice)) {
    return;
  }

  shipConsoleVisible = !shipConsoleVisible;
  if (shipConsoleVisible) {
    showBootWindow();
  }
  else {
    closeBootWindow(forceClose);
  }
}

window.onload = windowLoadListener;
