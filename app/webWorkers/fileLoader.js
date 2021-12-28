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

export {
  getJson,
}
