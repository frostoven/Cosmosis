const fs = require('fs');
const { spawn } = require('child_process');
import ChangeTracker from 'change-tracker/src';

import packageJson from '../../package.json';
import { getStartupEmitter } from '../emitters';
import { forEachFn, safeString, structuredClone } from '../local/utils';
import { getAllDefaults, getConfigInfo } from './defaultsConfigs';
import {
  getFriendlyFsError, convertToOsPath, createJsonIfNotExists
} from '../local/fsUtils';
import { logBootInfo } from '../local/windowLoadListener';

// TODO: create readme in CosmosisGame on boot that tells users not to create dirs as dirs are treated as profiles.
//  Mention that they may create customs dirs with {dot}whatever, and that these will be ignored by the engines.

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

// --- Vars ---------------------------------------------------------------- //

// Used to measure how long profile load takes.
let startTime = null;
// This is set to true if an error is encountered.
let disableSaving = false;
// Ex. %AppData%\CosmosisGame or ~/.local/share/CosmosisGame
const { gameDataDirName } = packageJson;
// The directory game saves are stored. Determined during init.
let dataDir = null;
// Also used as the fallback profile.
const defaultProfileName = 'default';
// Profile that is currently in use.
//  TODO: retrieve this info from CosmosisGame/profile.json instead (or create if not exists, etc).
let activeProfile = defaultProfileName;
// Used to prevent unnecessary disk reads.
let configCache = {};
// Used for invalidation callbacks.
const cacheChangeEvent = new ChangeTracker();

// --- Profile functions --------------------------------------------------- //

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
 * Attempts to create a new user profile. Note that a profile is simply an
 * empty directory by default. The config loader will create new files as
 * needed.
 * @param name
 * @param showAlertOnFail
 * @param callback - passes null,true on success and null,false on failure.
 */
function createProfile({ profileName, showAlertOnFail=true, callback=e=>{} }) {
  const safeName = safeString(profileName);
  if (safeName !== profileName) {
    console.warn(
      `Changing requested profile name from '${profileName}' to '${safeName}'.`
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

function deleteProfile({ profileName, callback }) {
  const safeName = safeString(profileName);
  if (profileName !== safeName) {
    const error = 'Invalid profile name given for deletion.';
    $modal.alert(error);
    return callback(error);
  }

  const target = `${dataDir}/${safeName}`;

  getAvailableProfiles({
    callback: (error, { profileNames }) => {
      if (error) {
        return callback(error);
      }
      if (profileNames.length < 2) {
        const error = 'You need at least one profile defined. Create ' +
          'another profile to delete this one.';
        $modal.alert({
          header: 'Cannot delete single remaining profile',
          body: error,
        });
        return callback(error);
      }

      fs.lstat(target, (error, stats) => {
        if (error) {
          $modal.alert(error.toString());
          return callback(error);
        }
        else if (stats.isDirectory()) {
          $modal.confirm({
            header: 'Confirm deletion',
            body: 'The below directory and all its contents will be deleted:\n' +
              `${convertToOsPath(target)}\n\nProceed?`,
            yesText: 'Delete',
            noText: 'Cancel',
          }, (deleteProfile) => {
            if (deleteProfile) {
              // TODO: convert to safe function. Basically, only delete files
              //  known to exist from templates. If dir is then empty, delete.
              //  If dir is not empty, refuse to delete and [modal] list the unknown
              //  files not tracked by the game. If we ever need to remove
              //  configs in future, we can simply mark them as obsolete in
              //  templates. Switch out of profile regardless of whether or not
              //  deletion was a success.
              fs.rmdir(convertToOsPath(target), { recursive: true }, (error) => {
                if (error) {
                  $modal.alert(error.toString());
                  return callback(error);
                }
                if (activeProfile === profileName) {
                  // We've deleted the active profile. Switch to literally any
                  // other profile.
                  getAvailableProfiles({
                    callback: (error, { profileNames }) => {
                      if (!profileNames || profileNames.length === 0) {
                        $modal.alert({
                            header: 'Critical profile error',
                            body: 'Warning: could not obtain profile list ' +
                              'result! Game might fall into a broken state; ' +
                              'please restart the game.'
                          }
                        );
                        return callback(error);
                      }
                      else {
                        setActiveProfile({
                          profileName: profileNames[0],
                          callback: (error) =>{
                            return callback(error);
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
            else {
              // TODO: toast: delete cancelled.
            }
          });
        }
        else {
          const message = 'Target profile is not a directory... this is ' +
            'likely a bug.';
          $modal.alert(message);
          return callback(message);
        }
      });
    }
  });
}

// Saves active profile's configs.
function saveActiveConfig({ identifier, dump, callback }) {
  saveConfig({ profileName: activeProfile, identifier, dump, callback });
}

// Saves active configs to specified profile.
function saveConfig({ profileName, identifier, dump, callback }) {
  if (profileName !== safeString(profileName)) {
    const error = 'Invalid profile name given to save.';
    $modal.alert(error);
    return callback(error);
  }

  const config = getAllDefaults()[identifier];
  if (!config || !config.info || !config.info.fileName) {
    const error = `Bad identifier '${identifier}', or missing file info.`;
    $modal.alert({ header: 'Error', body: error });
    return callback(error);
  }

  const target = `${dataDir}/${profileName}/${config.info.fileName}`;
  fs.writeFile(target, JSON.stringify(dump, null, 4), 'utf-8', (error) => {
    if (error) {
      $modal.alert({
        header: 'Save error',
        body: 'Could not save the following profile config:\n' +
          convertToOsPath(target) + '\n\n' +
          `Reason: ${getFriendlyFsError(error.code)}.`,
      });
      return callback(error);
    }
    else {
      // TODO: toast save success.
      callback(null);
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
  return activeProfile;
}

/**
 * Changes the active profile, which will trigger a read from disk. Fails with
 * a message if profile does not exist.
 * @param {string} profileName
 * @param [preventFallback] - Used internally to be prevent recursion on bad profile errors.
 * @param {function} [callback]
 */
function setActiveProfile({ profileName, preventFallback=false, callback }) {
  if (!profileName) {
    const message = 'setActiveProfile needs a profile name.';
    console.error('[userProfile]', message);
    return callback({ message });
  }
  const cacheBackup = configCache;

  // Create all needed configs.
  createAllProfileConfigs({
    profileName,
    onComplete: (error) => {
      if (!error) {
        // Load all profile configs.
        loadAllConfigs({
          profileName,
          onComplete: (error) => {
            if (error) {
              configCache = cacheBackup;
              cacheChangeEvent.setValue(configCache);

              if (!preventFallback) {
                $modal.alert({
                  header: 'Error loading profile',
                  body: 'Could not fully load profile; some parts may be. ' +
                    'corrupted. Falling back to default.'
                });
                setActiveProfile({
                  profileName: defaultProfileName,
                  preventFallback: true,
                  callback
                });
              }
              else {
                configCache = cacheBackup;
                cacheChangeEvent.setValue(configCache);

                // TODO: concoct some catastrophic situation to test this (such
                //  as corrupting the default profile templates or whatever).
                $modal.alert({
                  header: 'Game state very corrupt',
                  body: 'Could not load fallback settings. Game profile may ' +
                    'be irreparable. Back up your saves just in case you ' +
                    'need them later, then delete them.\n\nSave files may be ' +
                    'found here:\n' +
                    convertToOsPath(dataDir),
                });
                return callback({ message: 'Profile irrecoverable.' });
              }
            }
            else {
              activeProfile = profileName;
              configCache.allProfiles.activeProfile = activeProfile;
              callback(null);
              cacheChangeEvent.setValue(configCache);
              saveActiveName();
            }
          }
        });
      }
      else {
        configCache = cacheBackup;
        cacheChangeEvent.setValue(configCache);
      }
    }
  });
}

// Saves the current profile name to allProfiles.json -> activeProfile.
function saveActiveName({ callback }=()=>{}) {
  if (!callback) callback = ()=>{};
  const base = getConfigInfo({ identifier: 'allProfiles' });
  if (!base || !base.fileName) {
    const error = '[userProfile] Could not determine where to save active ' +
      'profile info because file info is missing in the built-ins.';
    console.error(error);
    $modal.alert({ header: 'Profile save error', body: error });
    return callback({ error });
  }

  const target = `${dataDir}/${base.fileName}`;
  fs.writeFile(target, JSON.stringify(configCache[base.name], null, 4), 'utf-8', (error) => {
    if (error) {
      $modal.alert({
        header: 'Save error',
        body: 'Could not save the following profile config:\n' +
          convertToOsPath(target) + '\n\n' +
          `Reason: ${getFriendlyFsError(error.code)}.`,
      });
      return callback(error);
    }
    else {
      callback(null);
    }
  });
}

// Lists all profiles that can be loaded (i.e. exist).
function getAvailableProfiles({ callback }) {
  // Find all dirs in data dir and return them. Exclude files starting with a
  // full stop.
  fs.readdir(dataDir, { withFileTypes: true }, (error, dirents) => {
    if (error) {
      callback(error);
    }
    else {
      const dirNames = dirents
        .filter((dirent) => {
          if (!dirent.isDirectory()) {
            // Only directories can be profiles.
            return false;
          }
          // If converting to safe string changes the name, then it means the
          // dir has forbidden characters. The .backups dir is an example of
          // this (safe strings cannot contain fullstops). This returns true if
          // this directory has no invalid characters.
          return dirent.name === safeString(dirent.name);

        })
        .map(dirent => dirent.name);
      callback(null, { profileNames: dirNames });
    }
  });
}

// Creates a backup of the specified profile. Backup is a copy of the profile
// dir and all its files. The backup is suffixed with the current date/time.
// Name / date is delimited with '.'.
// Example: CosmosisGame/.backups/default.2020-08-01-2104-59
// where the date format is profile.YYYY-MM-DD-HHmm-ss
function createProfileBackup(profile) {
  console.log('createProfileBackup: TBA');
}

// Deletes all but the last four backups.
// TODO: make backup count configurable from the customisation menu.
function deleteOldBackups() {
  //
}

// Get list of profile backups.
function getBackupList() {
  // Decide on a backup scheme before planning this out.
  console.log('getBackupList: TBA');
}

// TODO: This will be implemented if profile migrations become necessary.
// Gives the user the option fill blank controls in their profile with new
// controls released in more recent versions. This aims to provide a fix for
// some other asshole games that just leave you with blank bindings after an
// update.
function polyfillStoredConfigs() {
  console.log('Not yet implemented.');
}

// Get latest cached copy of specified config. Note: there are zero disk reads
// in this function; it *always* returns cache. Disk reads are done in other
// functions pertaining to boot and invalidation.
function getCurrentConfig({ identifier }) {
  if (!identifier) {
    return null;
  }
  return configCache[identifier];
}

// Creates all profile configs needed for the game to function normally. Does
// not do anything for files that already exist.
function createAllProfileConfigs({ profileName, showAlertOnFail=true, onComplete }) {
  const profileDir = `${dataDir}/${profileName}`;
  // Check if requested profile exists:
  fs.lstat(profileDir, (error, stats) => {
    if (error) {
      const message = `Cannot read profile '${profileName}' because its ` +
        'directory does not exist:\n' +
        convertToOsPath(profileDir);
      showAlertOnFail && $modal.alert(message);
      onComplete({ message });
    }
    else {
      // Proceed with creating configs.
      const allConfigs = [];
      const templates = getAllDefaults({ asArray: true });
      for (let i = 0, len = templates.length; i < len; i++) {
        const { info, fileContent } = templates[i];
        if (!info.fileName || !info.name) {
          console.error(
            '[userProfile]',
            'Cannot create a profile config because either info.name or ' +
            'info.fileName is missing in the template config.\n' +
            'Offending config:', templates[i],
          );
        }
        else {
          let fileName = `${profileDir}/${info.fileName}`;
          if (info.profileAgnostic) {
            fileName = `${dataDir}/${info.fileName}`;
          }

          allConfigs.push((cb) => {
            createJsonIfNotExists({
              fileName,
              content: fileContent,
              callback: (error, fileWasCreated) => {
                if (fileWasCreated) {
                  console.log(`* Created profile config '${info.fileName}'.`);
                }
                cb(error);
              },
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
              `${fileErrors} config file${fileErrors === 1 ? '' : 's'} could ` +
              'not be written. Some functions may not work correctly.',
            );
          }
          onComplete(fileErrors ? { fileErrors } : null);
        },
      );
    }
  });
}

// Reloads configs for current profile from disk and reapplies them.
function reloadConfigs({ onComplete }) {
  loadAllConfigs({ profileName: activeProfile, onComplete });
}

// Loads all configs for the specified profile. If a config cannot be loaded,
// uses internal default.
// Does *not* notify cache listeners of changes because this function is
// usually called by other functions that do precise cache control themselves.
// TODO: polyfill all configs on load, and test to ensure it works.
function loadAllConfigs({ profileName, onComplete }) {
  const allConfigs = [];
  const templates = getAllDefaults({ asArray: true });
  for (let i = 0, len = templates.length; i < len; i++) {
    const { info, fileContent } = templates[i];
    if (!info.fileName || !info.name) {
      console.error(
        '[userProfile]',
        'Cannot read a profile config because either info.name or ' +
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
        fs.readFile(fileName, 'utf-8', (error, data) => {
          if (error) {
            // TODO: mark profile as broken here?
            // TODO: induce an error to ensure this works.
            console.error(
              `[userProfile] Could not open ${fileName}; falling back to template.`,
            );
            // console.log(`** method 1: from template (configCache[${info.name}])`);
            configCache[info.name] = structuredClone(fileContent);
          }
          else {
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
        cacheChangeEvent.setValue(configCache);
      }
      catch (notifyError) {
        console.error('[userProfile/loadAllConfigs/notifyAll]', notifyError);
        errorInfo = {
          error: notifyError.message,
        };
      }
      onComplete(errorInfo);
    });
}

// --- Boot functions ------------------------------------------------------ //

const Boot = function(){};

// Used to measure how long profile load takes
Boot.startTimer = function startTimer(next) {
  startTime = Date.now();
  next({ error: null, completed: 'startTime' });
};

// Logs the amount of time since startTimer was run.
Boot.stopTimerAndLogResult = function stopTimerAndLogResult(next) {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`User profile took ${totalTime} seconds to load.`);
  logBootInfo(`Profile boot time: ${totalTime}s`);
  next({ error: null, completed: 'stopTimerAndLogResult' });
};

Boot.setDataDirPath = function setDataDirPath(next) {
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
};

// This is technically a copy-paste of createProfile, but aims to be a bit more
// descriptive because a broken default profile breaks the game.
Boot.createDefaultProfileDir = function createDefaultProfileDir(next) {
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
            `created.\n\nDetails:\n${getFriendlyFsError(error.code)}.`,
          completed: 'createDefaultProfileDir',
        });
    }
  });
};

// This creates all files that will be requires for a normally functioning
// profile.
Boot.createDefaultProfileFiles = function createDefaultProfileFiles(next) {
  createAllProfileConfigs({
    profileName: defaultProfileName,
    onComplete: (error) => {
      next({ error, completed: 'createDefaultProfileFiles' });
    }
  });
};

// Checks which profile was last known to be active, and activates that.
Boot.determineLastActiveProfile = function determineLastActiveProfile(next) {
  const base = getConfigInfo({ identifier: 'allProfiles' });
  if (!base || !base.fileName) {
    const error = '[userProfile] Could not determine last active profile ' +
      'because file info is missing in the built-ins. Reverting to "default".';
    console.error(error);
    return next({ error, completed: 'determineLastActiveProfile' });
  }

  const target = `${dataDir}/${base.fileName}`;
  fs.readFile(target, (error, data) => {
    if (error) {
      return next({ error, completed: 'determineLastActiveProfile' });
    }

    let json;
    try {
      json = JSON.parse(data);
    }
    catch (e) {
      return next({
        // TODO: change this to a modal that gives the user the
        //  option to delete the file and replace with a template.
        //  ## good first task?
        error: 'A config file is corrupted. Falling back to built-in ' +
          `defaults. Culprit:\n${convertToOsPath(target)}`,
        completed: 'determineLastActiveProfile',
      });
    }

    activeProfile = json.activeProfile || defaultProfileName;
    logBootInfo(`Loaded profile: ${activeProfile}`, true);
    next({ error: null, completed: 'determineLastActiveProfile' });
  });
};

// Loads all configs for the active profile. If a config cannot be loaded,
// uses internal default.
Boot.loadActiveConfigs = function loadActiveConfigs(next) {
  loadAllConfigs({
    profileName: activeProfile,
    onComplete: (error) => {
      next({ error, completed: 'loadActiveConfigs' });
    }
  });
};

// --- Init ---------------------------------------------------------------- //

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
      console.error('[userProfile]', message);
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
      Boot.startTimer,
      Boot.setDataDirPath,
      Boot.createDefaultProfileDir,
      Boot.createDefaultProfileFiles,
      Boot.determineLastActiveProfile,
      Boot.loadActiveConfigs,
      Boot.stopTimerAndLogResult,
    ],
    // On each step completed:
    (info) => {
      clearTimeout(stallChecker);
      lastCheckedTime = Date.now();
      stallChecker = checkForStalling();
      lastCompletedFunction = info.completed;

      // FIXME: errors and fallbacks are not functioning correctly. Introduce
      //  an error randomly, say at determineLastActiveProfile, and insure that:
      //  1) An error is shown,
      //  2) Defaults are actually loaded,
      //  3) Game is in read-only state.
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
  saveConfig,
  deleteProfile,
  saveActiveConfig,
  setActiveProfile,
  getActiveProfile,
  getDataDir,
  navigateToDataDir,
  getCurrentConfig,
  getAvailableProfiles,
  reloadConfigs,
};

export default {
  init,
  createProfile,
  deleteProfile,
  saveConfig,
  saveActiveConfig,
  getDataDir,
  navigateToDataDir,
  getActiveProfile,
  setActiveProfile,
  getBackupList,
  getCurrentConfig,
  cacheChangeEvent,
  getAvailableProfiles,
  reloadConfigs,
}
