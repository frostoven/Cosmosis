// Warning: destructuring arguments within function parameters causes three.js
// to think we have DOM scope, which causes a crash. Unsure at this stage
// what's causing it. Need to do more research; it might be a Webpack issue.
// If it's a three.js issue, need to report a bug.

import * as THREE from 'three';
import localClusterStarShader from '../scenes/localClusterStarShader';
import { getJson } from './fileLoader';
import { addDebugCornerIndicators, addDebugSideCounters } from './debugTools';
import { jsonNoiseGen } from '../universeFactory/noise';
import { createRenderer } from '../local/renderer';

const options = {
  debugSides: false,
  debugCorners: false,
};

let scene, renderer, starFieldScene, cubeCamera, cubeRenderTarget;

self.onmessage = function createOffscreenSkybox(message) {
  const options = message.data;
  const target = api[options.endpoint];
  if (target) {
    target(options);
  }
  else {
    console.error(`[offscreenSkybox] Unknown endpoint '${options.endpoint}'.`);
  }
};

const api = {
  init: ({ drawingSurface, width, height, pixelRatio, catalogPath, debugSides, debugCorners }) => {
    self.debugSides = !!debugSides;
    self.debugCorners = !!debugCorners;

    getJson(catalogPath, (error, catalogJson) => {
      if (error) {
        console.error('Could not load star catalog', catalogPath);
      }
      else {
        init(drawingSurface, width, height, pixelRatio, catalogJson);
      }
    });
  },
  renderFace: ({ x, y, z, sideNumber, tag }) => { renderFace( x, y, z, sideNumber, tag) },
  // Tests heavy data copies. Defaults to 300MB, which is the expected
  // worst-case scenario.
  testHeavyPayload: ({ size=300000 }) => {
    const crazyResult = jsonNoiseGen(size);
    postMessage({ error: null, key: 'testHeavyPayload', value: crazyResult });
  },
};

let totalInitCallbacks = 0;
function doInitCallbackWhenReady() {
  if (++totalInitCallbacks >= 2) {
    postMessage({ error: null, key: 'init', value: true });
  }
}

function init(canvas, width, height, pixelRatio, catalogJson) {
  scene = new THREE.Scene();

  /* =========================================================== */
  // TODO: this crashes, investigate why. For now we just create the renderer
  //  manually below.
  // renderer = createRenderer({
  //   initialisation: { antialias: true, logarithmicDepthBuffer: true, alpha: false, canvas: canvas, },
  //   options: { width, height, devicePixelRatio: pixelRatio, }
  // });

  renderer = new THREE.WebGLRenderer({
    // TODO: set star-based anti-alias in graphics menu.
    antialias: true,
    logarithmicDepthBuffer: true,
    canvas: canvas,
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.preserveDrawingBuffer = false;
  renderer.autoClear = true;
  /* =========================================================== */

  const gl = renderer.context;
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_COLOR);

  let starFieldScene = localClusterStarShader.init({
    // catalogBlob: new TextDecoder().decode(catalogBlob),
    catalogJson,
    onLoaded: doInitCallbackWhenReady,
  });
  scene.add(starFieldScene);

  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  cubeCamera = new THREE.CubeCamera(0.001, 100000, cubeRenderTarget);
  scene.add(cubeCamera);

  cubeCamera.update(renderer, scene);

  if (self.debugSides) {
    addDebugSideCounters(scene);
  }
  if (self.debugCorners) {
    addDebugCornerIndicators(scene);
  }

  // Ensure at least part of the scene starts getting ready.
  renderer.render(scene, cubeCamera.children[0]);

  // Give render time to complete.
  requestAnimationFrame(() => {
    doInitCallbackWhenReady();
  });
}

function renderFace(x, y, z, sideNumber, tag, silent=false) {
  if (sideNumber > 5) {
    return console.error('Side number', sideNumber, 'is not in range 0..5');
  }

  renderer.render(scene, cubeCamera.children[sideNumber]);

  postMessage({
    error: null,
    key: 'renderFace',
    value: { x, y, z, sideNumber, tag },
  });
}

function startLiveRender() {
  // TODO: implement me. Requires that coords are sent over every frame. If
  //  that causes issue, it would need to be every 2nd, or 3rd, instead. Maybe
  //  even give the live-render users the option of choosing how often the live
  //  render updates.
}

function stopLiveRender() {
  // TODO: implement me.
}
