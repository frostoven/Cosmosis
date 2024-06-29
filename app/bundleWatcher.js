/**
 * Used for functions that run independently of the bundled application, such
 * as code that waits for the first-time bundle build to finish. This allows us
 * to give a user (who didn't read the manual) meaningful updates even if the
 * project hasn't been built yet.
 *
 * Note that this file should not be migrated to TypeScript as NW.js does not
 * natively support TS, and this file is never bundled.
 */

// Automatically reload the application if code changes occur.

if (process.env && process.env.NODE_ENV !== 'production') {
  // This flag allows us to disable HMR when we don't want reloads during
  // debugging.
  window.hmrDisabled = false;

  const bootLog = [];

  const fs = require('fs');
  const crypto = require('crypto');

  function hash(string) {
    return crypto.createHash('md5').update(string).digest('hex');
  }

  const hashRecords = {
    './build/game.js': null,
    './build/offscreenGalaxy.js': null,
  };

  function reload(event, filename, oldHash) {
    if (filename) {
      if (window.hmrDisabled) {
        return console.log('HMR: Ignoring external changes.');
      }

      let newHash;
      try {
        newHash = hash(fs.readFileSync(filename));
        // console.log(`${filename} file changed; oldHash=${oldHash}, newHash=${newHash}`);
        hashRecords[filename] = newHash;
      }
      catch (error) {
        return console.log(error);
      }
      // Webpack sometimes modifies files multiple times in a short span,
      // causing a broken reload. Wait a bit for it to finish.
      setTimeout(() => {
        // In some cases we may receive reload spam. This often indicates that
        // our bundle hasn't actually changed. We check that here to reduce
        // frivolous reloads.
        if (hashRecords[filename] === oldHash) {
          return console.log('Ignoring new bundle; reload appears unneeded.');
        }
        else {
          // Currently a bug in nw.js. TODO: remove once they fix it.
          // nw.Window.get().reload();
          window.location = window.location;
        }
      }, 250);
    }
  }

  /**
   * Note: Only call this function if it's clear that the game bundle has not
   * yet been loaded. #boot-log is usually managed by windowLoadListener, but
   * windowLoadListener is part of the bundle, while this file is not. In
   * essence, this function is a work-around for first-time build delays.
   * @param {string} message
   * @param {boolean} [appendToLast]
   * @private
   */
  function _logToUi(message, appendToLast = false) {
    let blinkySeparator = '<br>';
    if (!appendToLast || !bootLog.length) {
      bootLog.push(message);
    }
    else {
      bootLog[bootLog.length - 1] += message;
      blinkySeparator = '';
    }

    const bootLogDiv = document.getElementById('boot-log');
    if (bootLogDiv) {
      bootLogDiv.innerHTML =
        bootLog.join('<br>') +
        blinkySeparator +
        '<div class="blinky" style="display: inline">_</div>';
      bootLogDiv.scrollIntoView({ block: 'center', inline: 'center' });
    }
    else {
      console.error('Could not interact with #boot-log');
    }
  }

  // Exists for first-time builds only.
  function _logFilesMissing() {
    fs.readFile('./package.json', (error, data) => {
      error && (data = '{ "version": "? information missing" }');
      let version;
      try {
        version = 'v' + JSON.parse(data).version;
      }
      catch (_) {
        // This can only be reached if the package.json file is corrupted while
        // the game is already running and then reloads. NW.js cannot cold-boot
        // from a corrupted package.json, and will crash instead.
        version = 'PACKAGE JSON CORRUPTED';
        _logToUi('!! Please reinstall the game !!');
      }

      _logToUi(`System boot ${version}`);
      _logToUi('BOOT FAILURE');
      _logToUi('One or more files missing.');
      _logToUi('Has the system been built?');
      _logToUi(' ');
      _logToUi(
        'Please be advised that, by decree of The EarthGov Corporation ' +
        'dated September 11, 2381, operating any spacecraft without ' +
        'official government-approved firmware is illegal. Violations are ' +
        'punishable by up to 40 years in a prison labor camp.',
      );
      _logToUi(' ');
      _logToUi('Waiting for bundle');
      _logToUi('...', true);
    });
  }

  let oneOrMoreFilesMissing = false;
  (function buildWatcher() {
    try {
      const files = Object.keys(hashRecords);
      for (let i = 0, len = files.length; i < len; i++) {
        const name = files[i];
        const fileHash = hash(fs.readFileSync(name));
        console.log(name, fileHash);
        fs.watch(name, (event) => reload(event, name, fileHash));
      }

      if (oneOrMoreFilesMissing) {
        // First-time build. Reload the app.
        _logToUi('WE HAVE A UNIVERSE');
        setTimeout(() => {
          window.location = window.location;
        }, 500);
      }
    }
    catch (error) {
      console.warn('Could not read source files. Build currently in progress?');
      if (!oneOrMoreFilesMissing) {
        setTimeout(() => {
          _logFilesMissing();
        }, 750);
      }
      oneOrMoreFilesMissing = true;
      // Keep checking until the files magically appear.
      setTimeout(() => {
        // The \u200B character allows CSS to break full-stops.
        _logToUi('\u200B.\u200B', true);
        buildWatcher();
      }, 1000);
    }
  })();
}
