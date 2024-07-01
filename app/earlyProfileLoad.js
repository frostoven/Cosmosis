/**
 * Used to load the profile before the application starts booting.
 */

import userProfile from './userProfile';

// Automatically show dev tools window if user has enabled it.
userProfile.cacheChangeEvent.getOnce(({ userOptions }) => {
  if (userOptions.debug.autoOpenDevTools) {
    nw.Window.get().showDevTools();
  }
});
