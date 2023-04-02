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

  function reload(event, filename) {
    if (filename) {
      if (window.hmrDisabled) {
        return console.log('HMR: Ignoring external changes.');
      }
      // console.log(`${filename} file Changed`);
      setTimeout(() => {
        // Webpack sometimes modifies files multiple times in a short span,
        // causing a broken reload. Wait a bit for it to finish.
        // Currently a bug in nw.js. TODO: remove once they fix it.
        // nw.Window.get().reload();
        chrome.tabs.reload();
      }, 250);
    }
  }

  const fs = require('fs');
  fs.watch('./build/game.js', reload);
  fs.watch('./build/offscreenSkybox.js', reload);
  fs.watch('./build/offscreenGalaxy.js', reload);
}
