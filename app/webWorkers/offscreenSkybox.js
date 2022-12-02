// Warning: destructuring arguments within function parameters causes three.js
// to think we have DOM scope, which causes a crash. Unsure at this stage
// what's causing it. Need to do more research; it might be a Webpack issue.
// If it's a three.js issue, need to report a bug.

import * as THREE from 'three';
import distantStars from '../scenes/distantStars';
import { getJson } from './fileLoader';
import { addDebugCornerIndicators, addDebugSideCounters } from './debugTools';
import { jsonNoiseGen } from '../universeFactory/noise';
import { prepareGalaxyData, getVisibleStars } from '../universeFactory';

const options = {
  disableSkybox: false,
  debugSides: false,
  debugCorners: false,
};

let scene, renderer, cubeCamera, cubeRenderTarget;

const api = {
  init: ({
    drawingSurface, width, height, skyboxAntialias, pixelRatio, catalogPath,
    disableSkybox, debugSides, debugCorners,
  }) => {
    options.disableSkybox = !!disableSkybox;
    options.debugSides = !!debugSides;
    options.debugCorners = !!debugCorners;

    getJson(catalogPath, (error, catalogJson) => {
      if (error) {
        console.error('Could not load star catalog', catalogPath);
      }
      else {
        init(drawingSurface, width, height, skyboxAntialias, pixelRatio, catalogJson);
      }
    });
  },
  renderFace: ({ x, y, z, sideNumber, tag, ticket }) => {
    renderFace(x, y, z, sideNumber, tag, ticket);
  },
  // Tests heavy data copies. Defaults to 300MB, which is the expected
  // worst-case scenario.
  testHeavyPayload: ({ size=300000 }) => {
    const crazyResult = jsonNoiseGen(size);
    postMessage({ error: null, key: 'testHeavyPayload', value: crazyResult });
  },
  getVisibleStars: (options) => {
    console.time('Star query processing time');
    options.result = getVisibleStars(options);
    console.timeEnd('Star query processing time');
    postMessage({
      error: null,
      key: 'getVisibleStars',
      value: options,
    });
  },
};

let totalInitCallbacks = 0;
// The init process has multiple asynchronous processes. This function triggers
// an 'init complete' message when all of them have executed. They're currently
// hardcoded as 3 operations, we may need to move them to a more robust queue.
function doInitCallbackWhenReady() {
  if (++totalInitCallbacks >= 2) {
    postMessage({ error: null, key: 'init', value: true });
  }
}

self.onmessage = function createOffscreenSkybox(message) {
  const options = message.data;
  if (options.ticket) {
    console.log(`%cThank you for your request, your ticket is number is #${options.ticket}`, 'font-style: italic;');
  }
  const target = api[options.endpoint];
  if (target) {
    target(options);
  }
  else {
    console.error(`[offscreenSkybox] Unknown endpoint '${options.endpoint}'.`);
  }
};

function init(canvas, width, height, skyboxAntialias, pixelRatio, catalogJson) {
  scene = new THREE.Scene();

  /* =========================================================== */
  // TODO: this crashes, investigate why. For now we just create the renderer
  //  manually below.
  // renderer = createRenderer({
  //   initialisation: { antialias: true, logarithmicDepthBuffer: true, alpha: false, canvas: canvas, },
  //   options: { width, height, devicePixelRatio: pixelRatio, }
  // });

  renderer = new THREE.WebGLRenderer({
    antialias: skyboxAntialias,
    logarithmicDepthBuffer: true,
    canvas: canvas,
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.preserveDrawingBuffer = false;
  renderer.autoClear = true;
  /* =========================================================== */

  const gl = renderer.getContext();
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_COLOR);

  // Adds data to the universe factory for later use. It doesn't actually parse
  // anything and is very fast.
  // TODO: add loaded catalog data to prepareGalaxyData. Also, starFieldScene
  //  should get its data from prepareGalaxyData, not from catalogs. This would
  //  allow for procedural data to enter the skybox.
  prepareGalaxyData(/*{ catalogs: [ catalogJson ] }*/); // TODO: UNCOMMENT CATALOG.

  if (options.disableSkybox) {
    doInitCallbackWhenReady();
  }
  else {
    let starFieldScene = distantStars.init({
      // catalogBlob: new TextDecoder().decode(catalogBlob),
      catalogJson,
      onLoaded: doInitCallbackWhenReady,
    });
    scene.add(starFieldScene);
  }

  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  cubeCamera = new THREE.CubeCamera(0.001, 100000, cubeRenderTarget);
  scene.add(cubeCamera);

  cubeCamera.update(renderer, scene);

  if (options.debugSides) {
    addDebugSideCounters(scene);
  }
  if (options.debugCorners) {
    addDebugCornerIndicators(scene);
  }

  // Ensure at least part of the scene starts getting ready.
  renderer.render(scene, cubeCamera.children[0]);

  // Give render time to complete.
  requestAnimationFrame(() => {
    doInitCallbackWhenReady();
  });
}

function renderFace(x, y, z, sideNumber, tag, ticket) {
  if (sideNumber > 5) {
    return console.error('Side number', sideNumber, 'is not in range 0..5');
  }

  renderer.render(scene, cubeCamera.children[sideNumber]);

  postMessage({
    error: null,
    key: 'renderFace', ticket,
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
