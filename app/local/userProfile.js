const fs = require('fs');
const { spawn } = require('child_process');
import packageJson from '../../package.json';
import { startupEvent, getStartupEmitter } from '../emitters';
import { getFriendlyFsError, convertToOsPath } from './fsUtils';
import { forEachFn, safeString } from './utils';

const startupEmitter = getStartupEmitter();

// This is set to true if an error is encountered.
let disableSaving = false;

// Ex. %AppData%\CosmosisGame or ~/.local/share/CosmosisGame
const { gameDataDirName } = packageJson;

// The directory game saves are stored. Determined during init.
let dataDir = null;

const defaultProfileName = 'default';

function getUserDataDir() {
  // Dev note: please always follow paths with a slash, and don't proceed dirs
  // with slashes when calling this function. The reason for this is that, if
  // we ever typo'd a new path and somehow managed to release this to users, it
  // would point to the local dir instead of root, meaning things like
  // deletions in the wrong dir become less deadly.
  if (process.env.APPDATA) {
    return process.env.APPDATA;
  }
  else if (process.platform === 'darwin') {
    return process.env.HOME + '/Library/Preferences';
  }
  else if (
    [ 'freebsd', 'linux', 'openbsd', 'sunos' ].indexOf(process.platform) !== -1
  ) {
    return process.env.HOME + '/.local/share';
  }
  else if (process.platform === 'android') {
    return '/storage/emulated/0';
  }
  else {
    return null;
  }
}

function setProfileBroken({ message }) {
  $modal.alert({ header: 'Profile error', body: message });
  disableSaving = true;
}

/**
 * Attempts to create a new user profile. Profiles contain everything from
 * control bindings to graphics options.
 * @param name
 * @param showAlertOnFail
 * @param callback - passes null,true on success and null,false on failure.
 */
function createProfile({ name, showAlertOnFail=true, callback=e=>{} }) {
  const safeName = safeString(name);
  if (safeName !== name) {
    console.warn(`Requested profile name '${name}' changed to '${safeName}'.`);
  }
  const target = `${dataDir}/${safeName}`;
  fs.mkdir(target, { recursive: true }, (error) => {
    if (!error) {
      callback(null, true);
    }
    else {
      showAlertOnFail && $modal.alert({
        header: 'Profile creation error',
        body: 'Could not create user profile at location:\n' +
          `${convertToOsPath(target)}\n\n` +
          `Reason: ${getFriendlyFsError(error.code)}.`,
      });
      callback(null, false);
    }
  });
}

function getDataDir() {
  return convertToOsPath(dataDir);
}

function navigateToDataDir() {
  const path = convertToOsPath(dataDir);
  switch (process.platform) {
    case 'win32':
      return spawn('explorer.exe', [path]);
    case 'darwin':
      return spawn('open', [path]);
    case 'android':
      return $modal.alert('Android not yet supported.');
    default:
      return spawn('xdg-open', [path]);
  }
}

function getActiveProfile() {
  console.log('getActiveProfile: TBA');
}

function setActiveProfile() {
  console.log('setActiveProfile: TBA');
}

function getBackupList() {
  console.log('getBackupList: TBA');
}

function setDataDirPath(next) {
  const dir = getUserDataDir();
  if (!dir) {
    next({
      error: 'Error! Could not figure out user profile directory location. ' +
        'No save-game files will be created.'
    });
  }
  else {
    dataDir = `${dir}/${gameDataDirName}`;
    next({ error: null });
  }
}

// This is technically a copy-paste of createProfile, but aims to be a bit more
// descriptive because a broken default profile breaks the game.
function createDefaultProfileDir(next) {
  const target = `${dataDir}/${defaultProfileName}`;
  fs.mkdir(target, { recursive: true }, (error) => {
    if (!error) {
      return next({ error: null });
    }

    switch (error.code) {
      case 'EEXIST':
        next({
          error: 'The profile directory location already exists, but ' +
            'it\'s not a directory. No save-game files will be created ' +
            'until this is corrected.\n\n' +
            'Consider deleting this file to solve the problem:\n' +
            convertToOsPath(target) +
            '\n\nOnce done, restart the game.',
        });
        break;
      case 'ENOTDIR':
        next({
          error: 'The profile directory cannot be created a because a file ' +
            'exists somewhere that conflicts with the needed name. No ' +
            'save-game files will be created until this is corrected\n\n' +
            'Please create the following directory, then restart the game:\n' +
            convertToOsPath(dataDir),
        });
        break;
      default:
        next({
          error: 'An error has occurred. No save-game files will be ' +
            'created.\n\nDetails:\n' + friendlyFsError[error.code],
        });
    }
  });
}

function createDefaultProfile() {
  //
}

function init() {
  // This runs all our asynchronous tasks one-by-one.
  forEachFn([
    setDataDirPath,
    createDefaultProfileDir,
  ], (data) => {
    // On each step completed:
    if (data.error) {
      setProfileBroken({ message: data.error });
      startupEmitter.emit(startupEvent.userProfileReady);
      return false;
    }
  }, (data) => {
    // On reach end:
    startupEmitter.emit(startupEvent.userProfileReady);
  });
}

debug.userProfile = {
  init,
  createProfile,
  getDataDir,
  navigateToDataDir,
};

export default {
  init,
  createProfile,
  getDataDir,
  navigateToDataDir,
  getActiveProfile,
  setActiveProfile,
  getBackupList,
}
