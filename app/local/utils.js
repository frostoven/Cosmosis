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
      onFind(error, null);
      return console.error(error);
    }

    let extRegex = '\\..*';
    if (extensions.length > 0) {
      extRegex = `\\.(${extensions.join('|')})$`;
    }

    const regex = new RegExp(`^${name}${extRegex}`);

    for (let i = 0, len = files.length; i < len; i++) {
      const fileName = files[i];
      if (fileName.match(regex)) {
        return onFind(null, `${path}/${fileName}`);
      }
    }

    onFind(null, null);
  });
}

/**
 * Creates a mechanism similar to async.waterfall.
 * @param {array} functions - Array of functions to run.
 * @param {function} callback
 */
function waterfall(functions=[], callback) {
  for (let i = 0, len = functions.length; i < len; i++) {
    const fn = functions[i];
    const stop = fn(callback);
    if (stop === false) {
      return;
    }
  }
}

export {
  fuzzyFindFile,
  waterfall,
}
