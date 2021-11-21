import fs from 'fs';

// All loaded shaders are stored here.
const shader = {};
// Amount of files that need to be loaded / skipped.
let shadersToLoad = null;
// If true, all shaders have been loaded.
let discoveryComplete = false;
// Used as keys in `shader`.
const term = {
  vert: 'vertexShader',
  frag: 'fragmentShader',
}

// Counts the amount of shaders loaded. Calls 'onComplete' if loaded shader
// count equals initial total count.
function checkAllComplete (onComplete) {
  if (!--shadersToLoad) {
    discoveryComplete = true;
    onComplete();
  }
}

function discoverShaders(onComplete=()=>{}) {
  if (discoveryComplete) {
    return onComplete();
  }
  fs.readdir('./shaders', (error, files) => {
    if (error) {
      discoveryComplete = true;
      console.error('Could not read shader directory.');
      return onComplete();
    }

    shadersToLoad = files.length;
    for (let i = 0, len = files.length; i < len; i++) {
      const file = files[i];
      if (!file.includes('.vert') && !file.includes('.frag')) {
        // We currently support .vert and .frag. This also weeds out .js.
        checkAllComplete(onComplete);
        continue;
      }

      fs.readFile('./shaders/' + file, (error, data) => {
        if (error) {
          console.error(`Could not read shader '${file}':`, error);
          return checkAllComplete(onComplete);
        }

        const baseName = file.replace(/\.[^/.]+$/, '');
        const shaderType = term[file.split('.').pop()];

        if (!shader[baseName]) {
          shader[baseName] = {};
        }
        shader[baseName][shaderType] = data.toString();
        checkAllComplete(onComplete);
      });
    }
  });
}

function getShader(name) {
  return shader[name];
}

export {
  discoverShaders,
  getShader,
}
