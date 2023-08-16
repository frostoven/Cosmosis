import * as THREE from 'three';

const imageBitmapLoader = new THREE.ImageBitmapLoader();

function requestPostAnimationFrame(task) {
  requestAnimationFrame(() => {
    setTimeout(task, 0);
  });
}

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

// function bufferToImageBitmap(buffer: ImageBitmap) {
//   return new THREE.CanvasTexture(buffer);
// }
//
// // Note: this is quite slow. Unless you specifically need a PNG, use
// // bufferToImageBitmap instead.
function bufferToPng(buffer, callback: Function) {
  const url = bufferToBlobUrl(buffer);
  imageBitmapLoader.load(url, function(imageBitmap) {
    callback(new THREE.CanvasTexture(imageBitmap));
  });
}

export {
  requestPostAnimationFrame,
  bufferToBlobUrl,
  bufferToString,
  // bufferToImageBitmap,
  bufferToPng,
}
