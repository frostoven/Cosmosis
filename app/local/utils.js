// Bunch of utility functions that are complete products by themselves.

// TODO: make this module (and the entire application) browser-compatible. This
//  would likely involve having a dedicated server feed things from a CDN
//  instead. Can't imagine streaming full graphics though... some of these
//  assets are HUGE. In fact, we might want the application to have 2 different
//  modes - local asset mode, and streamed asset mode.
const fs = require('fs');

/**
 * Looks for a file non-recursively that matches the name and has one
 * of the specified extensions. If no extension is specified, matches any
 * extension. This function will never match files that have no extension.
 * @param {string} path
 * @param {string|null} name
 * @param {string|array} extensions - All the extensions you want to match.
 * @param {function} onFind
 */
function fuzzyFindFile(
  { path='./', name=null, extensions=[], onFind=null }={ onFind: null }
) {
  if (!onFind || !name) {
    return console.error(
      'fuzzyFindFile requires at minimum a name and a callback function.'
    );
  }

  if (typeof extensions === 'string') {
    extensions = [ extensions ];
  }

  fs.readdir(path, (error, files) => {
    if (error) {
      onFind(error, null, null);
      // return console.error(error);
      return;
    }

    let extRegex = '\\..*';
    if (extensions.length > 0) {
      extRegex = `\\.(${extensions.join('|')})$`;
    }

    const regex = new RegExp(`^${name}${extRegex}`);

    for (let i = 0, len = files.length; i < len; i++) {
      const fileName = files[i];
      if (fileName.match(regex)) {
        return onFind(null, fileName, path);
      }
    }

    onFind(new Error('No matching files found.'), null, null);
  });
}

/**
 * Runs callback functions in sequence, only calling the next function once the
 * previous completes. If cb returns false, the loop terminates.
 * @param {Array.<function>} functions - List of functions to execute.
 * @param {function} cb - Run after every function completes. If cb returns
 *  false, the loop immediately terminates.
 * @param {function} onReachEnd - Called if the loop runs all the way to the
 * end, of if a fatal error occurs.
 * @param {number} limit - Maximum number of iterations. Make this the size of
 *  the function array to execute all functions.
 * @param {number} index - Index to start iterating from.
 * @param {boolean} defer - If true, each reiteration will be done as a
 *  setImmediate. Please note that doing so is incredibly slow at large scales.
 */
function forEachFnLimit(functions=[], cb=()=>{}, onReachEnd=()=>{}, limit, index, defer=false) {
  // console.log(`forEachFnLimit: limit=${limit}, index=${index}`)
  if (isNaN(index) || isNaN(limit)) {
    return onReachEnd(
      new Error('forEachFnLimit: limit and index should be numbers.')
    );
  }
  if (index >= limit) {
    return onReachEnd(null);
  }

  const fn = functions[index];

  fn(function() {
    const signal = cb.apply(null, arguments);
    if (signal === false) {
      return;
    }

    if (defer) {
      // TODO: make this setTimeout if in browser instead.
      setImmediate(() => {
        forEachFnLimit(functions, cb, onReachEnd, limit, index + 1, defer);
      });
    }
    else {
      forEachFnLimit(functions, cb, onReachEnd, limit, index + 1, defer);
    }
  });
}

/**
 * Runs callback functions in sequence, only calling the next function once the
 * previous completes. If cb returns false, the loop terminates.
 * @param {Array.<function>} functions - List of functions to execute.
 * @param {function} cb - Run after every function completes. If cb returns
 *  false, the loop immediately terminates.
 * @param {function} onReachEnd - Called if the loop runs all the way to the
 * end, of if a fatal error occurs.
 * @param {boolean} defer - If true, each reiteration will be done as a
 *  setImmediate. Please note that doing so is incredibly slow at large scales.
 */
function forEachFn(functions=[], cb=()=>{}, onReachEnd=()=>{}, defer=false) {
  forEachFnLimit(functions, cb, onReachEnd, functions.length, 0);
}

export {
  fuzzyFindFile,
  forEachFn,
  forEachFnLimit,
}
