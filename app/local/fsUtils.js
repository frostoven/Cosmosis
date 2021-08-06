const path = require('path');
import { access, constants, writeFile } from 'fs';

// Example:
// 'Could not create user profile at location:\n' +
//  `${target}\n\n` +
//  `Reason: ${getFriendlyFsError(error)}.`
const friendlyFsError = {
  EACCES: 'you do not have sufficient permissions',
  EEXIST: 'a file already exists at that location',
  ENOENT: 'no such file or directory',
  ENOTDIR: 'target location is not a directory',
  ENOTEMPTY: 'the target directory is not empty',
  EPERM: 'operation not permitted - you might have insufficient ' +
    'permissions, or the file has a read-only flag set',
};

function getFriendlyFsError(error) {
  const result = friendlyFsError[error];
  if (result) {
    return result;
  }
  return error;
}

// Converts fs path to forward slashes or backslashes, depending on OS.
function convertToOsPath(str) {
  // https://stackoverflow.com/questions/53799385/how-can-i-convert-a-windows-path-to-posix-path-using-node-path
  // First, convert to posix strings:
  str = str.split(path.sep).join(path.posix.sep);
  if (process.platform === 'win32') {
    return str.split('/').join(path.win32.sep);
  }
  else {
    return str;
  }
}

/**
 * Check if specified JSON file exists. If not, creates it with the specified data.
 * @param {string} fileName
 * @param {any} content - Any content that can survive JSON.stringify.
 * @param {function} callback(error, creationPerformed)
 */
function createJsonIfNotExists({ fileName, content={}, callback=()=>{} }) {
  // Check if the file exists in the current directory, and if it is writable.
  // https://nodejs.org/api/fs.html#fs_fs_access_path_mode_callback
  access(fileName, constants.F_OK, (error) => {
    if (error) {
      // File does not exist; create it.
      writeFile(fileName, JSON.stringify(content, null, 4), 'utf-8', (error) => {
        if (error) {
          // Error; indicate that no creation was done.
          return callback(error, false);
        }
        // Success; indicate that a new file was created.
        callback(null, true);
      });
    }
    else {
      // File exists; indicate that no creation was done.
      callback(null, false);
    }
  });
}

export {
  getFriendlyFsError,
  convertToOsPath,
  createJsonIfNotExists,
}
