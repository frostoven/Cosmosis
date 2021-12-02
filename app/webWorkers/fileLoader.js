// XMLHttpRequest wrapper.
function xmrRequest(options) {
  const request = new XMLHttpRequest();
  request.open('GET', options.path, true);
  request.responseType = options.responseType;
  request.onload = function() {
    const status = request.status;
    if (status === 200) {
      options.onload(null, request.response);
    }
    else {
      options.onload(status, request.response);
    }
  };
  request.send();
}

// Reads a JSON file from the specified path.
function getJson(path, callback) {
  xmrRequest({
    path,
    responseType: 'json',
    onload: callback,
  });
}

/**
 * Loads all shader files that have the specified name.
 * @param {string} name - Shader file name, excluding extension.
 * @param {function} callback - cb(error, { fragmentShader, vertexShader });
 */
function getShader(name, callback) {
  const file = `../shaders/${name}`;
  const responseType = 'text';

  // Get fragment shader.
  xmrRequest({
    path: `${file}.frag`,
    responseType,
    onload: (error, fragmentShader) => {
      if (error) {
        return callback(error);
      }

      // Get vertex shader.
      xmrRequest({
        path: `${file}.vert`,
        responseType,
        onload: (error, vertexShader) => {
          if (error) {
            return callback(error);
          }

          // Return results.
          callback(null, {
            fragmentShader,
            vertexShader,
          });
        },
      });
    },
  });
}

export {
  getJson,
  getShader,
}
