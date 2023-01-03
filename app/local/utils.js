// Bunch of utility functions that are complete products by themselves.

// TODO: make this module (and the entire application) browser-compatible. This
//  would likely involve having a dedicated server feed things from a CDN
//  instead. Can't imagine streaming full graphics though... some of these
//  assets are HUGE. In fact, we might want the application to have 2 different
//  modes - local asset mode, and streamed asset mode.
const fs = require('fs');
// Used for fast object cloning.
const v8 = require('v8');

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
      const match = fileName.match(regex);
      if (match) {
        const extension = match[1];
        return onFind(null, fileName, path, extension);
      }
    }

    onFind(new Error('No matching files found.'), null, null);
  });
}

/**
 * Runs callback functions in sequence, only calling the next function once the
 * previous completes. If cb returns false, the loop terminates. Note that
 * you're passed a 'next' function after each iteration, which you need to
 * call for the loop to continue.
 * @param {Array.<function>} functions - List of functions to execute.
 * @param {function} cb - Run after every function completes. If cb returns
 *  false, the loop immediately terminates. Else, the value is passed to the
 *  next function.
 * @param {function} onReachEnd - Called if the loop runs all the way to the
 * end, of if a fatal error occurs.
 * @param {number} limit - Maximum number of iterations. Make this the size of
 *  the function array to execute all functions.
 * @param {number} index - Index to start iterating from.
 * @param {boolean} [defer] - If true, each reiteration will be done as a
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

  function next() {
    const signal = cb.apply(null, arguments);
    if (signal === false) {
      return;
    }

    if (defer) {
      // TODO: make this setTimeout instead if in browser (polyfill maybe?).
      setImmediate(() => {
        forEachFnLimit(functions, cb, onReachEnd, limit, index + 1, defer);
      });
    }
    else {
      forEachFnLimit(functions, cb, onReachEnd, limit, index + 1, defer);
    }
  }

  fn(next);
}

/**
 * Runs callback functions in sequence, only calling the next function once the
 * previous completes. If cb returns false, the loop terminates. Note that
 * you're passed a 'next' function after each iteration, which you need to
 * call for the loop to continue.
 * @param {Array.<function>} functions - List of functions to execute.
 * @param {function} [cb] - Run after every function completes. If cb returns
 *  false, the loop immediately terminates.
 * @param {function} [onReachEnd] - Called if the loop runs all the way to the
 * end, of if a fatal error occurs.
 * @param {boolean} [defer] - If true, each reiteration will be done as a
 *  setImmediate. Please note that doing so is incredibly slow at large scales.
 */
function forEachFn(functions=[], cb=()=>{}, onReachEnd=()=>{}, defer=false) {
  forEachFnLimit(functions, cb, onReachEnd, functions.length, 0);
}

/**
 * Example: 'thisIsAString' becomes 'this Is A String'.
 * @param {string} string
 */
function addSpacesBetweenWords(string) {
  let result = string.replace(/([A-Z])/g, " $1");
  if (result[0] === ' ') {
    // Remove leading space.
    result = result.substring(1);
  }
  return result;
}

/**
 * Example: 'thisString' becomes 'ThisString'.
 * @param {string} string
 */
function toTitleCase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Combines addSpacesBetweenWords and toTitleCase.
 * @param {string} string
 * @returns {string}
 */
function spacedTitled(string) {
  return addSpacesBetweenWords(toTitleCase(string));
}

function lowercaseFirst(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function capitaliseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function capitaliseEachWord(string) {
  const splitStr = string.split(' ');
  for (let i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your
    // for does that for you.
    // Assign it back to the array.
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(' ');
}

/**
 * Removes all special characters that could cause filename or cmd/terminal
 * command issues with knows operating systems.
 * @param string
 * @returns {string}
 */
function safeString(string) {
  return string.replace(/[^a-zA-Z0-9 \-_@^()',;+={}\[\]]/g, '').trim();
}

/**
 * Creates a deep clone of object using the serialization API directly exposed
 * by Node. Used specifically because it's meant to be very fast.
 * TODO: for interest sake, performance test this vs
 *  JSON.parse(JSON.stringify(o)) to ensure this isn't bad premature
 *  optimisation.
 * @param obj
 * @returns {any}
 */
function structuredClone(obj) {
  return v8.deserialize(v8.serialize(obj));
}

/**
 * Returns a random item from specified array.
 * @param {Array} underpantsGnomes
 */
function randomArrayItem(underpantsGnomes=[]) {
  return underpantsGnomes[Math.floor(Math.random() * underpantsGnomes.length)];
}

/**
 * Checks if one array contains the contents of another array. Returns false
 * if any arguments are falsy.
 * @param {Array|undefined} array
 * @param {Array|undefined} includes
 */
function arrayContainsArray(array, includes) {
  if (!array || !includes) {
    return false;
  }

  return includes.every((value) => {
    return array.includes(value);
  });
}

export {
  fuzzyFindFile,
  forEachFn,
  forEachFnLimit,
  addSpacesBetweenWords,
  toTitleCase,
  spacedTitled,
  lowercaseFirst,
  capitaliseFirst,
  capitaliseEachWord,
  safeString,
  structuredClone,
  randomArrayItem,
  arrayContainsArray,
}
