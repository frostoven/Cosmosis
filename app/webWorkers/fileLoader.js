function getJson (path, callback) {
  const request = new XMLHttpRequest();
  request.open('GET', path, true);
  request.responseType = 'json';
  request.onload = function() {
    const status = request.status;
    if (status === 200) {
      callback(null, request.response);
    }
    else {
      callback(status, request.response);
    }
  };
  request.send();
}

export {
  getJson,
}
