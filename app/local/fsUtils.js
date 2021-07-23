const path = require("path");

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
  EPERM: 'operation not permitted - you likely have insufficient permissions',
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

export {
  getFriendlyFsError,
  convertToOsPath,
}
