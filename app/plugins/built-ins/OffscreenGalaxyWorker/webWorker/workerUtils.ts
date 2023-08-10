import * as THREE from 'three';

const imageBitmapLoader = new THREE.ImageBitmapLoader();

function bufferToBlobUrl(buffer) {
  const blob = new Blob([ buffer ]);
  return URL.createObjectURL(blob);
}

function bufferToString(array: Iterable<number>) {
  const buffer = new Uint8Array(array);
  let result: string[] = [];
  for (let i = 0, len = buffer.length; i < len; i++) {
    result.push(String.fromCharCode(buffer[i]));
  }
  return result.join('');
}

function bufferToPng(buffer, callback: Function) {
  const url = bufferToBlobUrl(buffer);
  imageBitmapLoader.load(url, function(imageBitmap) {
    callback(new THREE.CanvasTexture(imageBitmap));
  });
}

export {
  bufferToBlobUrl,
  bufferToString,
  bufferToPng,
}
