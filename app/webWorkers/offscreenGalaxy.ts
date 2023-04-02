import * as THREE from 'three';
import MilkyWayGen from '../universeFactory/MilkyWayGen';
import {
  TYPE_POSITIONAL_DATA, ROT_X, ROT_Y, ROT_Z, ROT_W,
} from './sharedBufferArrayConstants';

// THREE.ColorManagement.enabled = true;

let camera, scene, renderer, group;

// Processes incoming messages. Supports serialized endpoints and shared buffer
// arrays.
self.onmessage = function(message) {
  const data = message.data;
  if (data.buffer) {
    const bufferArray: Float64Array = data;
    const bufferType = bufferArray[0];
    if (bufferType === TYPE_POSITIONAL_DATA) {
      receivePositionalInfo(bufferArray);
    }
    else {
      console.error(`[offscreenGalaxy] Buffer type ${bufferType} is not valid`);
    }
  }
  else {
    const endpoint: string = data.endpoint;
    if (endpoint === 'init') {
      init(data.drawingSurface, data.width, data.height, data.pixelRatio, data.path);
    }
    else if (endpoint === 'positionalDump') {
      receivePositionalInfo(message)
    }
    else {
      console.error(`[offscreenGalaxy] Endpoint '${endpoint}' is not valid`);
    }
  }
};

function init(canvas, width, height, pixelRatio, path) {
  camera = new THREE.PerspectiveCamera(55, width / height, 1, 1000);
  // TODO: receive post message from main thread indicating universe position,
  //  and then move universe instead of camera in opposite direction.
  camera.position.set(50, 0, 60);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000f15);

  const galaxy = new MilkyWayGen().createGalaxy();
  scene.add(galaxy);

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.outputEncoding = THREE.sRGBEncoding;

  animate();
  console.log('xxx end of init reached. animate() has been invoked.');
}

function receivePositionalInfo(bufferArray: Float64Array) {
  if (!camera) {
    console.log('camera not ready:', {camera});
    return;
  }

  camera.quaternion.set(
    bufferArray[ROT_X],
    bufferArray[ROT_Y],
    bufferArray[ROT_Z],
    bufferArray[ROT_W],
  );

  // Release variable back to main thread.
  // @ts-ignore
  self.postMessage(bufferArray, [ bufferArray.buffer ]);
}

function animate() {
  // TODO: delete me; just here for testing purposes.
  camera.position.z -= 0.002;
  renderer.render(scene, camera);

  if (self.requestAnimationFrame) {
    self.requestAnimationFrame(animate);
  }
}

// PRNG

let seed = 1;

function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export default init;
