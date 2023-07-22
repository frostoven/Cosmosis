/**
 * Used for functions that need to run very early (such as boot-debugging
 * tools).
 */

import userProfile from './userProfile';

// Automatically show dev tools window if user has enabled it.
userProfile.cacheChangeEvent.getOnce(({ userOptions }) => {
  if (userOptions.debug.autoOpenDevTools) {
    nw.Window.get().showDevTools();
  }
});

// Automatically reload the application if code changes occur.
if (process.env && process.env.NODE_ENV !== 'production') {
  // This flag allows us to disable HMR when we don't want reloads during
  // debugging.
  window.hmrDisabled = false;

  const fs = require('fs');
  const crypto = require('crypto');

  function hash(string) {
    return crypto.createHash('md5').update(string).digest('hex');
  }

  const hashRecords = {
    './build/game.js': null,
    './build/offscreenSkybox.js': null,
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
          chrome.tabs.reload();
        }
      }, 250);
    }
  }

  const files = Object.keys(hashRecords);
  for (let i = 0, len = files.length; i < len; i++) {
    const name = files[i];
    const fileHash = hash(fs.readFileSync(name));
    console.log(name, fileHash);
    fs.watch(name, (event) => reload(event, name, fileHash));
  }
}
