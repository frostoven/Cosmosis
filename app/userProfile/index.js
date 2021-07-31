import CbQueue from '../local/CbQueue';

const fs = require('fs');
const { spawn } = require('child_process');

import packageJson from '../../package.json';
import { startupEvent, getStartupEmitter } from '../emitters';
import { forEachFn, safeString, structuredClone } from '../local/utils';
import { getAllDefaults } from './defaultsConfigs';
import {
  getFriendlyFsError, convertToOsPath, createJsonIfNotExists
} from '../local/fsUtils';

/*
Process brain dump
==================
Game starts, creates default dir. It then creates all config files if they do
not exist.
userProfile launches in window onload. provides callback. on callback done,
load rest of game. add little note on how long profile init took.
 * If creation fails, profile is set to read-only and a template is returned
   instead. Any future requests return templates, too.
 * If creation succeeds, the engine then reads the file from disk and returns
   that to the user. If read fails, profile goes read-only and returns a
   template.
  Note: all this read-only stuff is only during boot. If read/write fails
  during normal gameplay (say, because of low disk space) the user should be
  warned and the profile will still be treated as read-write. This allows the
  user the opportunity to try remedy the situation.
  TODO: test all this before releasing stable build.
  TODO: maybe give user option to receive save info as text dump if disk is
   broken and they cannot save.
*/

const startupEmitter = getStartupEmitter();

// Used to measure how long profile load takes.
let startTime = null;
// This is set to true if an error is encountered.
let disableSaving = false;
// Ex. %AppData%\CosmosisGame or ~/.local/share/CosmosisGame
const { gameDataDirName } = packageJson;
// The directory game saves are stored. Determined during init.
let dataDir = null;
// Also used the fallback profile.
const defaultProfileName = 'default';
// Profile that is currently in use.
//  TODO: retrieve this info from CosmosisGame/profile.json instead (or create if not exists, etc).
const activeProfile = defaultProfileName;
// Used to prevent unnecessary disk reads.
const configCache = {};
// Used for invalidation callbacks.
const cacheListeners = new CbQueue();

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
    // Note: OpenBSD is likely going to give us issues with its 'everything is
    // a file and nothing is a directory' mentality.
    // TODO: test this on OpenBSD at some point.
    return process.env.HOME + '/.local/share';
  }
  else if (process.platform === 'android') {
    return '/storage/emulated/0';
  }
  else {
    return null;
  }
}

// Disables saving changes to disk. Displays a message to indicate this.
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
    console.warn(
      `Changing requested profile name from '${name}' to '${safeName}'.`
    );
  }
  const target = `${dataDir}/${safeName}`;
  fs.mkdir(target, { recursive: true }, (error) => {
    if (!error) {
      callback(null, true);
    }
    else {
      showAlertOnFail && $modal.alert({
        header: 'Profile creation error',
        body: 'Could not load or create user profile at location:\n' +
          `${convertToOsPath(target)}\n\n` +
          `Reason: ${getFriendlyFsError(error.code)}.`,
      });
      callback(error, false);
    }
  });
}

function getDataDir() {
  return convertToOsPath(dataDir);
}

// Opens a native OS file browser. Path is game user data directory.
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

// Get profile that's currently active (ex. 'default').
function getActiveProfile() {
  console.log('getActiveProfile: TBA');
}

// Changes the active profile, which will trigger a read from disk. Fails with
// a message if profile does not exist.
function setActiveProfile() {
  console.log('setActiveProfile: TBA');
}

// Lists all profiles that can be loaded (i.e. exist).
function getAvailableProfiles() {
  console.log('getAvailableProfiles: TBA');
}

// Get list of profile backups.
function getBackupList() {
  console.log('getBackupList: TBA');
}

// This will be implemented if profile migrations become necessary.
// Gives the user the option fill blank controls in their profile with new
// controls released in more recent versions. This aims to provide a fix for
// some other asshole games that just leave you with blank bindings after an
// update.
function polyfillStoredConfigs() {
  console.log('Not yet implemented.');
}

// Useful for looking at the configs as they were before the user modified
// them.
function getDefaultConfig(identifier, alternativeContent=null) {
  if (alternativeContent) {
    return getAllDefaults()[identifier].alternativeContent[alternativeContent];
  }
  return getAllDefaults()[identifier].fileContent;
}

// Get latest cached copy of specified config. Note: there are zero disk reads
// in this function; it *always* returns cache. Disk reads are done in other
// functions pertaining to boot and invalidation.
function getCurrentConfig(identifier) {
  console.log('Not yet implemented: getCurrentConfig.');
}

// Adds a listener that is called when user configs are changed or loaded from
// disk.
function addCacheListener(onCacheInvalidate) {
  cacheListeners.register(onCacheInvalidate);
}

function removeCacheListener(listener) {
  cacheListeners.deregister(listener);
}

// Creates all profile configs needed for the game to function normally. Does
// not do anything for files that already exist.
function createAllProfileConfigs({ profileName, showAlertOnFail=true, onComplete }) {
  const allConfigs = [];
  const templates = getAllDefaults({ asArray: true });
  for (let i = 0, len = templates.length; i < len; i++) {
    const { info, fileContent } = templates[i];
    if (!info.fileName || !info.name) {
      console.error(
        'Cannot create a profile config because either info.name or ' +
        'info.fileName is missing in the template config.\n' +
        'Offending config:', templates[i],
      );
    }
    else {
      let fileName = `${dataDir}/${profileName}/${info.fileName}`;
      if (info.profileAgnostic) {
        fileName = `${dataDir}/${info.fileName}`;
      }

      allConfigs.push((cb) => {
        createJsonIfNotExists({
          fileName,
          content: fileContent,
          callback: cb,
        });
      });
    }
  }

  let fileErrors = 0;
  forEachFn(
    // All functions being processed:
    allConfigs,
    // On each step completed:
    (error) => {
      if (error) {
        fileErrors++;
      }
    },
    // On reach end:
    () => {
      if (fileErrors && showAlertOnFail) {
        $modal.alert(
          `${fileErrors} config files could not be written. Some functions` +
          `may not work correctly.`,
        );
      }
      onComplete(fileErrors ? { fileErrors } : null);
    });
}

// Used to measure how long profile load takes
function startTimer(next) {
  startTime = Date.now();
  next({ error: null, completed: 'startTime' });
}

// Logs the amount of time since startTimer was run.
function stopTimerAndLogResult(next) {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`User profile took ${totalTime} seconds to load.`);
  next({ error: null, completed: 'stopTimerAndLogResult' });
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
    next({ error: null, completed: 'setDataDirPath' });
  }
}

// This is technically a copy-paste of createProfile, but aims to be a bit more
// descriptive because a broken default profile breaks the game.
function createDefaultProfileDir(next) {
  const target = `${dataDir}/${defaultProfileName}`;
  fs.mkdir(target, { recursive: true }, (error) => {
    if (!error) {
      return next({ error: null, completed: 'createDefaultProfileDir' });
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
          completed: 'createDefaultProfileDir',
        });
        break;
      case 'ENOTDIR':
        next({
          error: 'The profile directory cannot be created a because a file ' +
            'exists somewhere that conflicts with the needed name. No ' +
            'save-game files will be created until this is corrected\n\n' +
            'Please create the following directory, then restart the game:\n' +
            convertToOsPath(dataDir),
          completed: 'createDefaultProfileDir',
        });
        break;
      default:
        next({
          error: 'An error has occurred. No save-game files will be ' +
            'created.\n\nDetails:\n' + getFriendlyFsError(error.code),
          completed: 'createDefaultProfileDir',
        });
    }
  });
}

// This creates all files that will be requires for a normally functioning
// profile.
function createDefaultProfileFiles(next) {
  createAllProfileConfigs({
    profileName: defaultProfileName,
    onComplete: (error) => {
      next({ error, completed: 'createDefaultProfileFiles' });
    }
  });
}

// Loads all configs for the activeProfile. If a config cannot be loaded, uses
// internal default.
function loadAllConfigs(next) {
  const allConfigs = [];
  const templates = getAllDefaults({ asArray: true });
  for (let i = 0, len = templates.length; i < len; i++) {
    const { info, fileContent } = templates[i];
    if (!info.fileName || !info.name) {
      console.error(
        'Cannot read a profile config because either info.name or ' +
        'info.fileName is missing in the template config.\n' +
        'Offending config:', templates[i],
      );
    }
    else {
      let fileName = `${dataDir}/${activeProfile}/${info.fileName}`;
      if (info.profileAgnostic) {
        fileName = `${dataDir}/${info.fileName}`;
      }

      allConfigs.push((cb) => {
        fs.readFile(fileName, 'utf-8', (error, data) => {
          if (error) {
            // TODO: mark profile as broken here?
            // TODO: induce an error to ensure this works.
            console.error(
              `[userProfile] Could not open ${fileName}; falling back to template.`
            );
            // console.log(`** method 1: from template (configCache[${info.name}])`);
            configCache[info.name] = structuredClone(fileContent);
          }
          else {
            // console.log('---> file opened');
            try {
              configCache[info.name] = JSON.parse(data);
              // console.log(`** method 2: from file (configCache[${info.name}])`);
            }
            catch (error) {
              console.error('[userProfile]', error);
              // console.log(`** method 1b (configCache[${info.name}])`);
              // TODO: change this to a modal that gives the user the
              //  option to delete the file and replace with a template.
              //  ## good first task?
              $modal.alert(
                `The config '${convertToOsPath(fileName)}' appears to be ` +
                'corrupt. Falling back to built-in template config.',
              );
              configCache[info.name] = structuredClone(fileContent);
            }
            cb();
          }
        });
      });
    }
  }

  forEachFn(
    // All functions being processed:
    allConfigs,
    // On each step completed:
    () => {},
    // On reach end:
    () => {
      let errorInfo = null;
      try {
        cacheListeners.notifyAll(configCache);
      }
      catch (notifyError) {
        console.error('[loadAllConfigs -> notifyAll]', notifyError);
        console.dir(notifyError);
        errorInfo = {
          error: notifyError.message,
        };
      }

      next({ error: errorInfo, completed: 'loadAllConfigs' });
    });
}

function init(onComplete=()=>{}) {
  let lastCheckedTime = Date.now();
  let lastCompletedFunction = 'profile -> init';

  // Used to ensure the boot process hasn't gotten stuck. Because this has
  // happened A LOT during development...
  function checkForStalling() {
    return setTimeout(() => {
      const message =
        '[userProfile] Startup is taking very long, and likely not going to' +
        'complete. This is most likely a bug that needs to be reported. ' +
        'Last completed function: ' +
        lastCompletedFunction;
      console.error(message);
      // We have to use regular 'alert' here because failing at this point
      // means the modal framework never gets loaded.
      // TODO: move React stuff not related to profile things to
      //  windowLoadListener instead so that this won't be an issue.
      //  Once done, make the modal cancellable if boot actually completes.
      // TODO: test load speed on spinning disk; we don't want values too low.
      //  It's under 10ms on SSD, so 1000ms is more than enough time.
      $modal.alert(message);
    }, 1000);
  }

  let stallChecker = checkForStalling();

  forEachFn(
    // Runs all our asynchronous startup tasks one-by-one, in order.
    [
      startTimer,
      setDataDirPath,
      createDefaultProfileDir,
      createDefaultProfileFiles,
      loadAllConfigs,
      stopTimerAndLogResult,
    ],
    // On each step completed:
    (info) => {
      clearTimeout(stallChecker);
      lastCheckedTime = Date.now();
      stallChecker = checkForStalling();
      lastCompletedFunction = info.completed;

      if (info && info.error) {
        setProfileBroken({ message: info.error });
        onComplete(info.error);
        return false;
      }
    },
    () => {
      // On reach end:
      clearTimeout(stallChecker);
      onComplete(null);
    });
}

debug.userProfile = {
  init,
  createProfile,
  getDataDir,
  navigateToDataDir,
  getDefaultConfig,
  getCurrentConfig,
};

export default {
  init,
  createProfile,
  getDataDir,
  navigateToDataDir,
  getActiveProfile,
  setActiveProfile,
  getBackupList,
  getDefaultConfig,
  getCurrentConfig,
  addCacheListener,
  removeCacheListener,
}
