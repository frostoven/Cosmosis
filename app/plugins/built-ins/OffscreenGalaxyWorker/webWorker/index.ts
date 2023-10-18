import _ from 'lodash';
import * as THREE from 'three';
import {
  API_BRIDGE_REQUEST,
  BACK_SIDE,
  BOTTOM_SIDE,
  FRONT_SIDE,
  LEFT_SIDE,
  POS_X,
  POS_Y,
  POS_Z,
  RIGHT_SIDE,
  ROT_W,
  ROT_X,
  ROT_Y,
  ROT_Z,
  SEND_SKYBOX,
  TOP_SIDE,
} from './sharedBufferArrayConstants';

import {
  EffectComposer,
} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {
  UnrealBloomPass,
} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import SpaceClouds from '../types/SpaceClouds';
import StarGenerator from '../types/StarGenerator';
import {
  bufferToPng,
  bufferToString,
} from './workerUtils';
import ChangeTracker from 'change-tracker/src';

let skyboxCurrentlyGenerating = false;
let liveAnimationActive = false;
let lastKnownOutsideInfo = {
  width: 0, height: 0, pixelRatio: 0, aspect: 1, fov: 45,
  moduloPosition: new THREE.Vector3(),
  cameraPosition: new THREE.Vector3(),
  cameraQuaternion: new THREE.Quaternion(),
};

const NEAR = 0.000001, FAR = 1e27, CUBE_ASPECT = 1;
const GFX_MODE_BRIGHTNESS = 0;
const GFX_MODE_BRIGHTNESS_AND_BLOOM = 1;

// TODO: test me.
// THREE.ColorManagement.enabled = true;

let camera: THREE.PerspectiveCamera, scene: THREE.Scene,
  renderer: THREE.WebGLRenderer, renderScene: RenderPass,
  bloomPass: UnrealBloomPass, bloomComposer: EffectComposer,
  mixPass: ShaderPass, finalComposer: EffectComposer,
  offscreenCanvas: OffscreenCanvas, intermediateSkybox: THREE.Mesh,
  postprocessingMaterial: THREE.ShaderMaterial;

// let cubeCamera: THREE.CubeCamera, cubeRenderTarget: THREE.WebGLCubeRenderTarget;

let galacticClouds: SpaceClouds = null as any;
let galacticStars: StarGenerator = null as any;

let inbound = {
  realStarData: null as any,
  starFogTexture: null as any,
  galaxyModel: null as any,
};

// 0: rotation function. 1: radians. 2: rotateY 90 degrees.
const sideAngles = [
  [ '(angle function)', 0, false ],
  [ '(angle function)', 0, false ],
  [ '(angle function)', 0, false ],
  [ '(angle function)', 0, false ],
  [ '(angle function)', 0, false ],
  [ '(angle function)', 0, false ],
];

// The 'true' circle unit.
const twoPi = 2 * Math.PI;
sideAngles[FRONT_SIDE] = [ 'rotateY', 0, false ];
sideAngles[RIGHT_SIDE] = [ 'rotateY', twoPi * 0.75, false ];
sideAngles[BACK_SIDE] = [ 'rotateY', twoPi * 0.5, false ];
sideAngles[LEFT_SIDE] = [ 'rotateY', twoPi * 0.25, false ];
sideAngles[TOP_SIDE] = [ 'rotateX', twoPi * 0.25, true ];
sideAngles[BOTTOM_SIDE] = [ 'rotateX', twoPi * 0.75, true ];

const onReceiveRealStarData = new ChangeTracker();
const onReceiveStarFogTexture = new ChangeTracker();
const onReceiveGalaxyModel = new ChangeTracker();
const onAssetsReady = new ChangeTracker();
const onWorkerBootComplete = new ChangeTracker();
const onSkyboxSentToMain = new ChangeTracker();

function init({ data }) {
  let { canvas, width, height, pixelRatio, path } = data;
  offscreenCanvas = canvas;
  // -- Basic stuff --------------------------------------------- //
  //

  let aspect, fov;
  scene = new THREE.Scene();

  // scene.background = new THREE.Color(0x000f15);
  // scene.background = new THREE.Color(0x010101);

  // const size = 0.00125;
  // const geometry = new THREE.BoxGeometry(size, size * 64, size);
  // const material2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // const cube = new THREE.Mesh(geometry, material2);
  // scene.add(cube);

  // Create internal skybox for multi-bake step purposes.
  const boxSize = 1000;
  const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize, 64, 64, 64);
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  material.side = THREE.BackSide;
  intermediateSkybox = new THREE.Mesh(geometry, material);
  scene.add(intermediateSkybox);

  // addDebugCornerIndicators(scene);
  // addDebugSideCounters(scene);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });

  if (!liveAnimationActive) {
    // Make things act like a cube camera.
    const size = Math.max(width, height);
    width = size;
    height = size;
    pixelRatio = null;
    aspect = 1;
    fov = -90;
  }
  else {
    aspect = width / height;
    fov = 55;
  }

  lastKnownOutsideInfo.width = width;
  lastKnownOutsideInfo.height = height;
  lastKnownOutsideInfo.pixelRatio = pixelRatio;
  lastKnownOutsideInfo.aspect = aspect;
  lastKnownOutsideInfo.fov = fov;

  renderer.useLegacyLights = false;
  pixelRatio && renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  // renderer.autoClear = false;
  // renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  camera = new THREE.PerspectiveCamera(fov, aspect, NEAR, FAR);
  camera.position.set(-0.028407908976078033, 0, 0.26675403118133545);

  const gl = renderer.getContext();
  gl.disable(gl.DEPTH_TEST);

  // -- Cubemap ------------------------------------------------- //

  // cubeRenderTarget = new THREE.WebGLCubeRenderTarget(2048, {
  //   format: THREE.RGBAFormat,
  //   generateMipmaps: true,
  //   minFilter: THREE.LinearMipmapLinearFilter,
  // });
  // cubeCamera = new THREE.CubeCamera(NEAR, FAR, cubeRenderTarget);
  // cubeCamera.position.set(-0.028407908976078033, 0, 0.26675403118133545);

  // -- Postprocessing ------------------------------------------ //

  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
  // 0-1. 0 = give all meshes bloom, 1 = no bloom.
  bloomPass.threshold = 0;
  // 0-3 - how fuzzy the bloom is.
  bloomPass.strength = 1;
  // 0-1 - how blurred the bloom is.
  bloomPass.radius = 0;

  const outputPass = new OutputPass();

  bloomComposer = new EffectComposer(renderer);
  bloomComposer.addPass(renderScene);

  postprocessingMaterial = new THREE.ShaderMaterial({
    uniforms: {
      // 0.18 is quite realistic, assuming you're inside one of the outer
      // galactic arms, and there's no ambient light. 1.0 is really
      // pretty. It's probably useful for special effects and being
      // inside the galactic center.
      // brightness: { value: 0.18 },
      brightness: { value: 1.0 },
      baseTexture: { value: null },
      // bloomTexture: { value: null },
      // Mode 0: brightness adjust. Mode 1: brightness adjust and bloom.
      mode: { value: 1 },
    },
    vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    fragmentShader: `
      uniform float brightness;
      uniform sampler2D baseTexture;
      // uniform sampler2D bloomTexture;
      uniform float mode;

      varying vec2 vUv;
      
      vec4 gammaToLinear(vec4 color) {
        color.r = pow(color.r, 2.2);
        color.g = pow(color.g, 2.2);
        color.b = pow(color.b, 2.2);
        return color;
      }

      void main() {
        vec4 base_color = texture2D(baseTexture, vUv);
        
        if (mode == 1.0) {
          vec4 bloom_color = vec4(0.0); //texture2D(bloomTexture, vUv);

          // float lum = 0.21 * bloom_color.r + 0.71 * bloom_color.g + 0.07 * bloom_color.b;
          // vec4 color4 = vec4(base_color.rgb + bloom_color.rgb, max(base_color.a, 1.0));
          vec4 color4 = vec4(base_color.rgb * brightness, 1.0);
          gl_FragColor = color4;
        }
        else {
          gl_FragColor = base_color * vec4(vec3(brightness), 1.0);
        }
      }
      `,
    defines: {},
  });
  const mixPass = new ShaderPass(postprocessingMaterial, 'baseTexture');
  mixPass.needsSwap = true;

  finalComposer = new EffectComposer(renderer);
  // finalComposer = new EffectComposer(renderer, cubeRenderTarget);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(mixPass);
  finalComposer.addPass(outputPass);
  finalComposer.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  initAstrometrics();

  self.postMessage({
    rpc: API_BRIDGE_REQUEST,
    replyTo: 'receiveWindowSize',
    options: { fn: 'onWindowResize' },
  });

  onAssetsReady.getOnce(() => {
    galacticClouds.showClouds();
    galacticStars.showStars();
    renderer.compile(scene, camera);
    finalComposer.renderer.compile(scene, camera);

    galacticStars.hideStars();
    postprocessingMaterial.uniforms.brightness.value = 0.18;
    // Render at least once before boot is marked complete:
    finalComposer.render();

    // debugAnimate();
    onWorkerBootComplete.setValue(Date.now());
  });
}

// Note: we should not rerender each frame. This function exists only for
// testing purposes.
function debugAnimate() {
  finalComposer.render();

  if (self.requestAnimationFrame) {
    self.requestAnimationFrame(debugAnimate);
  }
}

// -------------------------------------------------------------- //

function initAstrometrics() {
  self.postMessage({
    rpc: API_BRIDGE_REQUEST,
    replyTo: 'receiveMilkyWayFogTexture',
    options: {
      fn: 'loadAsset',
      assetName: 'fogColumn',
      catalogFunction: 'getSmokeImage',
    },
  });

  self.postMessage({
    rpc: API_BRIDGE_REQUEST,
    replyTo: 'receiveMilkyWayModel',
    options: {
      fn: 'loadAsset',
      assetName: 'milky_way',
      catalogFunction: 'getStarCatalog',
    },
  });

  self.postMessage({
    rpc: API_BRIDGE_REQUEST,
    replyTo: 'receiveRealStarData',
    options: {
      fn: 'loadAsset',
      assetName: 'bsc5p_3d_min',
      catalogFunction: 'getStarCatalog',
    },
  });

  ChangeTracker.waitForAll([
    onReceiveStarFogTexture,
    onReceiveGalaxyModel
  ]).getOnce(() => {
    galacticClouds = new SpaceClouds({
      datasetMode: false,
      scene,
      fogTexture: inbound.starFogTexture,
      galaxyMeshUrl: inbound.galaxyModel,
    });
    onReceiveRealStarData.getOnce(() => {
      galacticClouds.onSolPosition.getOnce((position) => {
        galacticStars = new StarGenerator({
          scene,
          stars: inbound.realStarData,
          solPosition: position,
        });

        galacticStars.onStarGeneratorReady.getOnce(() => {
          galacticClouds.onSpaceCloudsReady.getOnce(() => {
            // The inbound object contains A LOT of data. Clear it to save RAM.
            // @ts-ignore
            inbound = Object.freeze({ message: 'worker boot complete' });
            onAssetsReady.setValue(true);
          });
        });
      });
    });
  });
}

function receiveRealStarData({ data }) {
  const jsonString = bufferToString(data.buffer);
  try {
    inbound.realStarData = JSON.parse(jsonString);
  }
  catch (error) {
    console.error('receiveRealStarData error:', error);
    inbound.realStarData = {};
  }
  onReceiveRealStarData.setValue(true);
}

function receiveMilkyWayModel({ data }) {
  // inbound.galaxyModel = bufferToBlobUrl(data.buffer);
  inbound.galaxyModel = data.buffer;
  onReceiveGalaxyModel.setValue(true);
}

function receiveMilkyWayFogTexture({ data }) {
  bufferToPng(data.buffer, (image) => {
    inbound.starFogTexture = image;
    onReceiveStarFogTexture.setValue(true);
  });
}

function receivePositionalInfo({ data }) {
  if (!camera) {
    console.log('[webWorker] camera not ready; retrying in 10ms.');
    setTimeout(() => {
      receivePositionalInfo({ data });
    }, 10);
    return;
  }

  const unitFactor = 0.00001;
  const modFactor = 1000;

  const bufferArray: Float64Array = new Float64Array(data.buffer);

  const x = bufferArray[POS_X] * unitFactor;
  const y = bufferArray[POS_Y] * unitFactor;
  const z = bufferArray[POS_Z] * unitFactor;
  const modX = Math.floor(x * modFactor) / modFactor;
  const modY = Math.floor(y * modFactor) / modFactor;
  const modZ = Math.floor(z * modFactor) / modFactor;

  const lastCam = lastKnownOutsideInfo.moduloPosition;
  const coordsUnchanged = lastCam.x === modX && lastCam.y === modY && lastCam.z === modZ;
  if (coordsUnchanged) {
    return;
  }
  lastKnownOutsideInfo.moduloPosition.set(modX, modY, modZ);

  lastKnownOutsideInfo.cameraQuaternion.set(
      bufferArray[ROT_X],
      bufferArray[ROT_Y],
      bufferArray[ROT_Z],
      bufferArray[ROT_W],
  );
  lastKnownOutsideInfo.cameraPosition.set(x, y, z);

  if (liveAnimationActive) {
    camera.quaternion.copy(lastKnownOutsideInfo.cameraQuaternion);
    intermediateSkybox.position.copy(lastKnownOutsideInfo.cameraPosition);
    camera.position.copy(lastKnownOutsideInfo.cameraPosition);
  }
  else if (!skyboxCurrentlyGenerating) {
    intermediateSkybox.position.copy(lastKnownOutsideInfo.cameraPosition);
    camera.position.copy(lastKnownOutsideInfo.cameraPosition);
  }

  debounceBuildSkybox();

  // Release variable back to the main thread.
  // This allows us to create an oscillating effect where the variable is
  // passed back and forth between threads. It's currently unknown which
  // produces more lag better bidirectional sharing and recreating
  // Float64Array from scratch each frame.
  // self.postMessage(bufferArray, [ bufferArray.buffer ]);
}

function receiveWindowSize({ data }) {
  let { width, height, pixelRatio } = data.serialData;
  let aspect: number;
  if (liveAnimationActive) {
    renderer.setSize(width, height, false);
    bloomComposer.setSize(width, height);
    finalComposer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    aspect = width / height;
  }
  else {
    const size = Math.max(width, height);
    width = height = size;

    renderer.setSize(size, size, false);
    bloomComposer.setSize(size, size);
    finalComposer.setSize(size, size);
    aspect = CUBE_ASPECT;
  }

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  finalComposer.render();

  lastKnownOutsideInfo.width = width;
  lastKnownOutsideInfo.height = height;
  lastKnownOutsideInfo.aspect = aspect;
  lastKnownOutsideInfo.pixelRatio = pixelRatio;
}

// Makes the skybox rerender each frame.
function actionStartDebugAnimation() {
  liveAnimationActive = true;
  // TODO: change fov by re-requesting from main
  debugAnimate();
}

// -------------------------------------------------------------- //

const debounceBuildSkybox = _.debounce(
    // Build skybox and send to main.
    () => mainRequestsSkybox(),
    // How long to wait and see if a new request is made.
    50,
    // Don't delay total wait time more than this number of milliseconds.
    {maxWait: 100}
);

function prepareForBackdropRender() {
  postprocessingMaterial.uniforms.mode.value = GFX_MODE_BRIGHTNESS;
  postprocessingMaterial.uniforms.brightness.value = 0.18;
  postprocessingMaterial.uniformsNeedUpdate = true;
  galacticClouds.showClouds();
  galacticStars.hideStars();
}

function prepareForStarRender() {
  postprocessingMaterial.uniforms.mode.value = GFX_MODE_BRIGHTNESS_AND_BLOOM;
  postprocessingMaterial.uniforms.brightness.value = 1.0;
  postprocessingMaterial.uniformsNeedUpdate = true;
  galacticClouds.hideClouds();
  galacticStars.showStars();
}

function drawBackdrop(side, renderCount, onComplete) {
  let skipScreenshot = renderCount > 0;
  requestAnimationFrame(() => {
    const screenshot = renderGalacticSide(side, skipScreenshot);
    if (renderCount > 0) {
      return drawBackdrop(side, renderCount - 1, onComplete);
    }
    else {
      onComplete(screenshot);
    }
  });
}

// Request to render one face of the skybox.
function drawSkyboxSide(side, triggerBuildOnMain = false, onDone) {
  onWorkerBootComplete.getOnce(() => {

    // This saddens me a bit, but I have not yet found a modern way of
    // updating texture maps without disposing the old maps. Methods used
    // with older Three.js don't appear to work.
    const oldMaterial = intermediateSkybox.material as THREE.MeshBasicMaterial;
    const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    blackMaterial.side = THREE.BackSide;
    intermediateSkybox.material = blackMaterial;
    oldMaterial.dispose();

    prepareForBackdropRender();
    drawBackdrop(side, 1, (galaxyBackdrop: ImageBitmap) => {
      // Place the galaxy background over the skybox mesh:
      const tempMaterial = intermediateSkybox.material as THREE.MeshBasicMaterial;
      const texture = new THREE.CanvasTexture(galaxyBackdrop);
      texture.colorSpace = 'srgb';
      intermediateSkybox.material = new THREE.MeshBasicMaterial({map: texture});
      intermediateSkybox.material.side = THREE.BackSide;
      tempMaterial.dispose();

      prepareForStarRender();
      drawBackdrop(side, 1, (buffer: ImageBitmap) => {
        self.postMessage({
          rpc: SEND_SKYBOX,
          options: {side, triggerBuild: triggerBuildOnMain},
          buffer,
          // @ts-ignore - This is actually correct. Source:
          // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap.
        }, [buffer]);
        onDone();
        onSkyboxSentToMain.setValue(true);
      });
    });
  });
}

function pointCameraToSide(side: number) {
  const [ axisFunction, radians, rotateFinal90 ] = sideAngles[side];
  camera.rotation.set(0, 0, 0);
  // @ts-ignore - error makes no sense.
  // eg: camera.rotateY(Math.PI * 0.25);
  camera[axisFunction](radians);
  rotateFinal90 && camera.rotateZ(Math.PI);
}

// Request to render all six sides of the skybox.
function mainRequestsSkybox() {
  if (!camera) {
    console.log('[webWorker] camera not ready; retrying in 10ms.');
    setTimeout(() => {
      mainRequestsSkybox();
    }, 10);
    return;
  }

  if (skyboxCurrentlyGenerating) {
    return;
  }
  skyboxCurrentlyGenerating = true;

  let i = 0;
  function drawNext() {
    pointCameraToSide(i);
    setTimeout(() => {
      drawSkyboxSide(
        // Which side to generate.
        i,
        // If true, the main thread will start skybox construction.
        i === 5,
        // Called when the render process is complete for a side.
        () => {
          if (++i < 6) {
            drawNext();
          }
          else {
            skyboxCurrentlyGenerating = false;
          }
        }
      );
    }, i);
  }
  drawNext();
}

// Request for galactic information.
function mainRequestsQuery() {
  console.error('Not yet implemented.');
}

// -------------------------------------------------------------- //

/**
 * @param side
 * @param skipScreenshot
 * @return ImageBitmap
 */
function renderGalacticSide(side: number, skipScreenshot: boolean) {
  // renderer.clear();
  // finalComposer.renderer.clear();
  finalComposer.render();
  if (!skipScreenshot) {
    return offscreenCanvas.transferToImageBitmap();
  }
}

// -------------------------------------------------------------- //

const endpoints = {
  init: init,
  receivePositionalInfo: receivePositionalInfo,
  receiveRealStarData: receiveRealStarData,
  receiveMilkyWayModel: receiveMilkyWayModel,
  receiveMilkyWayFogTexture: receiveMilkyWayFogTexture,
  receiveWindowSize: receiveWindowSize,
  actionStartDebugAnimation: actionStartDebugAnimation,
  mainRequestsSkybox: mainRequestsSkybox,
};

// Processes incoming messages. Supports serialized endpoints and shared buffer
// arrays.
self.onmessage = function(message) {
  const data = message.data;
  const endpoint: string = data.endpoint;
  const receiver = endpoints[endpoint];
  if (receiver) {
    receiver(message);
  }
  else {
    console.error(`[Galaxy web worker] Invalid endpoint '${endpoint}'`);
  }
};

export default init;
