import * as THREE from 'three';
import {
  API_BRIDGE_REQUEST,
  BACK_SIDE,
  BOTTOM_SIDE,
  FRONT_SIDE,
  LEFT_SIDE,
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
import { bufferToPng, bufferToString } from './workerUtils';
import ChangeTracker from 'change-tracker/src';
import { addDebugCornerIndicators, addDebugSideCounters } from './debugTools';

const NEAR = 0.000001, FAR = 1e27;
const GFX_MODE_BRIGHTNESS = 0;
const GFX_MODE_BRIGHTNESS_AND_BLOOM = 1;

// TODO: test me.
// THREE.ColorManagement.enabled = true;

let camera: THREE.PerspectiveCamera, scene: THREE.Scene,
  renderer: THREE.WebGLRenderer, renderScene: RenderPass,
  bloomPass: UnrealBloomPass, bloomComposer: EffectComposer,
  mixPass: ShaderPass, finalComposer: EffectComposer,
  offscreenCanvas: OffscreenCanvas, intermediateSkybox: THREE.Mesh,
  postprocessingMaterial: THREE.ShaderMaterial,
  skyboxMaterial: THREE.MeshBasicMaterial;

// let cubeCamera: THREE.CubeCamera, cubeRenderTarget: THREE.WebGLCubeRenderTarget;

let galacticClouds: SpaceClouds = null as any;
let galacticStars: StarGenerator = null as any;

let inbound = {
  realStarData: null as any,
  starFogTexture: null as any,
  galaxyModel: null as any,
};

const sideAngles = [
  [ '(angle function)', 0 ],
  [ '(angle function)', 0 ],
  [ '(angle function)', 0 ],
  [ '(angle function)', 0 ],
  [ '(angle function)', 0 ],
  [ '(angle function)', 0 ],
  [ '(angle function)', 0 ],
  [ '(angle function)', 0 ],
];

// The 'true' circle unit.
const twoPi = 2 * Math.PI;
sideAngles[FRONT_SIDE] = [ 'rotateY', 0 ];
sideAngles[RIGHT_SIDE] = [ 'rotateY', twoPi * 0.75 ];
sideAngles[BACK_SIDE] = [ 'rotateY', twoPi * 0.5 ];
sideAngles[LEFT_SIDE] = [ 'rotateY', twoPi * 0.25 ];
sideAngles[TOP_SIDE] = [ 'rotateX', twoPi * 0.25 ];
sideAngles[BOTTOM_SIDE] = [ 'rotateX', twoPi * 0.75 ];

const onReceiveRealStarData = new ChangeTracker();
const onReceiveStarFogTexture = new ChangeTracker();
const onReceiveGalaxyModel = new ChangeTracker();
const onAssetsReady = new ChangeTracker();
const onWorkerBootComplete = new ChangeTracker();

function init({ data }) {
  const { canvas, width, height, pixelRatio, path } = data;
  offscreenCanvas = canvas;
  // -- Basic stuff --------------------------------------------- //
  camera = new THREE.PerspectiveCamera(45, width / height, NEAR, FAR);
  camera.position.set(-0.028407908976078033, 0, 0.26675403118133545);
  //
  // cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
  //   format: THREE.RGBAFormat,
  //   generateMipmaps: true,
  //   minFilter: THREE.LinearMipmapLinearFilter
  // });
  // cubeCamera = new THREE.CubeCamera(NEAR, FAR, cubeRenderTarget);

  scene = new THREE.Scene();

  // scene.background = new THREE.Color(0x000f15);
  // scene.background = new THREE.Color(0x010101);

  // const size = 0.00125;
  // const geometry = new THREE.BoxGeometry(size, size * 64, size);
  // const material2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // const cube = new THREE.Mesh(geometry, material2);
  // scene.add(cube);

  // Create internal skybox for multi-bake step purposes.
  const size = 0.1;
  const geometry = new THREE.BoxGeometry(size, size, size);
  skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  skyboxMaterial.side = THREE.BackSide;
  intermediateSkybox = new THREE.Mesh(geometry, skyboxMaterial);
  scene.add(intermediateSkybox);

  addDebugCornerIndicators(scene);
  addDebugSideCounters(scene);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.useLegacyLights = false;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.autoClear = false;

  const gl = renderer.getContext();
  gl.disable(gl.DEPTH_TEST);

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
          gl_FragColor = gammaToLinear(color4);
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
    console.log('camera not ready:', {camera});
    return;
  }

  const bufferArray: Float64Array = new Float64Array(data.buffer);
  camera.quaternion.set(
    bufferArray[ROT_X],
    bufferArray[ROT_Y],
    bufferArray[ROT_Z],
    bufferArray[ROT_W],
  );

  // Release variable back to the main thread.
  // This allows us to create an oscillating effect where the variable is
  // passed back and forth between threads. It's currently unknown which
  // produces more lag better bidirectional sharing and recreating
  // Float64Array from scratch each frame.
  // self.postMessage(bufferArray, [ bufferArray.buffer ]);
}

function receiveWindowSize({ data }) {
  const { width, height, devicePixelRatio } = data.serialData;

  renderer.setSize(width, height, false);
  bloomComposer.setSize(width, height);
  finalComposer.setSize(width, height);
  renderer.setPixelRatio(devicePixelRatio);

  // const size = Math.max(width, height);
  // cubeRenderTarget.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  finalComposer.render();
}

// Makes the skybox rerender each frame.
function actionStartDebugAnimation() {
  debugAnimate();
}

// -------------------------------------------------------------- //

// Request to render one face of the skybox.
function mainRequestsSkyboxSide({ data }) {
  onWorkerBootComplete.getOnce(() => {
    const side = data.options.side;

    postprocessingMaterial.uniforms.mode.value = GFX_MODE_BRIGHTNESS;
    postprocessingMaterial.uniforms.brightness.value = 0.18;
    galacticClouds.showClouds();
    galacticStars.hideStars();
    let buffer = renderGalacticSide(side);

    // Place the galaxy background over the skybox mesh:
    const oldMaterial = intermediateSkybox.material;
    intermediateSkybox.position.copy(camera.position);
    intermediateSkybox.material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(buffer) });
    intermediateSkybox.material.side = THREE.BackSide;
    oldMaterial.dispose();
    // skyboxMaterial.material.needsUpdate = true;
    // skyboxMaterial.uniforms.map!.value.image.src = new THREE.CanvasTexture(buffer);

    postprocessingMaterial.uniforms.mode.value = GFX_MODE_BRIGHTNESS_AND_BLOOM;
    postprocessingMaterial.uniforms.brightness.value = 1.0;
    galacticClouds.hideClouds();
    galacticStars.showStars();
    buffer = renderGalacticSide(side);

    self.postMessage({
      rpc: SEND_SKYBOX,
      options: { side },
      buffer,
      // @ts-ignore - This is actually correct. Source:
      // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap.
    }, [ buffer ]);
  });
}

// Request to render all six sides of the skybox.
function mainRequestsSkyBox() {
}

// Request for galactic information.
function mainRequestsQuery() {
}

// -------------------------------------------------------------- //

// function takeCubeScreenshot() {
//   galacticClouds.showClouds();
//   galacticStars.hideStars();
//   renderer.clear();
//   postprocessingMaterial.uniforms.brightness.value = 0.18;
//   finalComposer.render();
//   //
//   galacticClouds.hideClouds();
//   galacticStars.showStars();
//   postprocessingMaterial.uniforms.brightness.value = 1.0;
//   finalComposer.render();
//   //
//   offscreenCanvas.convertToBlob().then((blob: Blob) => {
//     blob.arrayBuffer().then((buffer) => {
//       console.log('==> canvas:', buffer);
//     });
//   });
// }

/**
 * @param side
 * @return ImageBitmap
 */
function renderGalacticSide(side: number) {
  const [ axisFunction, radians ] = sideAngles[side];
  camera.rotation.set(0, 0, 0);
  // eg: camera.rotateY(Math.PI * 0.25);
  camera[axisFunction](radians);
  renderer.clear();
  finalComposer.render();
  return offscreenCanvas.transferToImageBitmap();
}

function createGalaxyBackdropSkybox() {
  //
}

// function createGalaxyBackdropSkybox() {
//   renderer.clear();
//   galacticClouds.showClouds();
//   galacticStars.showStars();
//   postprocessingMaterial.uniforms.brightness.value = 1.0;
//   postprocessingMaterial.uniforms.mode.value = GFX_MODE_BRIGHTNESS_AND_BLOOM;
//   finalComposer.render();
//
//   // offscreenCanvas.convertToBlob().then((blob: Blob) => {
//   //   blob.arrayBuffer().then((buffer: ArrayBuffer) => {
//   //     console.log('==> sending canvas buffer:', buffer);
//   //     // @ts-ignore
//   //     self.postMessage({ rpc: SEND_SKYBOX, buffer }, [ buffer ]);
//   //   });
//   // });
//
//   // console.log('====> IMAGE BITMAP:', offscreenCanvas.transferToImageBitmap());
//   // Note: ImageBitmap are transferable.
//   const buffer: ImageBitmap = offscreenCanvas.transferToImageBitmap();
//   self.postMessage({
//     rpc: SEND_SKYBOX,
//     options: { side: FRONT_SIDE },
//     buffer,
//     // @ts-ignore - This is actually correct. Source:
//     // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap.
//   }, [ buffer ]);
// }

function createStarBackdropSkybox() {
  //
}

function createSkybox() {
  onWorkerBootComplete.getOnce(() => {
    // galacticClouds.showClouds();
    // galacticStars.hideStars();
    // // --> takeCubeScreenshot
    //
    // galacticClouds.hideClouds();
    // galacticStars.showStars();
    // // --> takeCubeScreenshot
    //
    // galacticStars.hideStars();
    // bookm
    // takeCubeScreenshot();
  });
}

// onWorkerBootComplete.getOnce(() => {
//   console.log('---> taking screenshot.');
//   createGalaxyBackdropSkybox();
// });

// -------------------------------------------------------------- //

const endpoints = {
  init: init,
  receivePositionalInfo: receivePositionalInfo,
  receiveRealStarData: receiveRealStarData,
  receiveMilkyWayModel: receiveMilkyWayModel,
  receiveMilkyWayFogTexture: receiveMilkyWayFogTexture,
  receiveWindowSize: receiveWindowSize,
  actionStartDebugAnimation: actionStartDebugAnimation,
  mainRequestsSkyboxSide: mainRequestsSkyboxSide,
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
