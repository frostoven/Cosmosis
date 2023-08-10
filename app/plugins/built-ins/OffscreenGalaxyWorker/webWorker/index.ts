import * as THREE from 'three';
import {
  ROT_X, ROT_Y, ROT_Z, ROT_W, RUNTIME_BRIDGE,
} from './sharedBufferArrayConstants';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import SpaceClouds from '../types/SpaceClouds';
import StarGenerator from '../types/StarGenerator';
import { bufferToPng, bufferToString } from './workerUtils';
import ChangeTracker from 'change-tracker/src';

const NEAR = 0.000001, FAR = 1e27;

// THREE.ColorManagement.enabled = true;

let camera, scene, renderer, renderScene, bloomPass, bloomComposer, mixPass, finalComposer;

let inbound = {
  realStarData: null as any,
  starFogTexture: null as any,
  galaxyModel: null as any,
};

const onReceiveRealStarData = new ChangeTracker();
const onReceiveStarFogTexture = new ChangeTracker();
const onReceiveGalaxyModel = new ChangeTracker();

function init({ data }) {
  const { canvas, width, height, pixelRatio, path } = data;
  // -- Basic stuff --------------------------------------------- //
  camera = new THREE.PerspectiveCamera(45, width / height, NEAR, FAR);
  camera.position.set(-0.028407908976078033, 0, 0.26675403118133545);
  // camera.position.set(50, 0, 160);

  scene = new THREE.Scene();

  // scene.background = new THREE.Color(0x000f15);
  // scene.background = new THREE.Color(0x010101);

  const size = 0.00125;
  const geometry = new THREE.BoxGeometry(size, size * 64, size);
  const material2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const cube = new THREE.Mesh(geometry, material2);
  scene.add(cube);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
    powerPreference: "high-performance",
  });
  renderer.useLegacyLights = false;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);

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

  const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        // 0.18 is quite realistic, assuming you're inside one of the outer
        // galactic arms, and there's no ambient light. 1.0 is really
        // pretty. It's probably useful for special effects and being
        // inside the galactic center.
        // brightness: { value: 0.18 },
        brightness: { value: 1.0 },
        baseTexture: { value: null },
        // bloomTexture: { value: null }
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

      varying vec2 vUv;

      void main() {
        vec4 base_color = texture2D(baseTexture, vUv);
        vec4 bloom_color = vec4(0.0);//texture2D(bloomTexture, vUv);

        // float lum = 0.21 * bloom_color.r + 0.71 * bloom_color.g + 0.07 * bloom_color.b;
        // vec4 color4 = vec4(base_color.rgb + bloom_color.rgb, max(base_color.a, 1.0));
        vec4 color4 = vec4(base_color.rgb * brightness, 1.0);
        gl_FragColor = color4;
      }
      `,
      defines: {},
    }), 'baseTexture',
  );
  mixPass.needsSwap = true;

  finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(mixPass);
  finalComposer.addPass(outputPass);

  initAstrometrics();

  animate();
  console.log('xxx end of init reached. animate() has been invoked.');
}

function initAstrometrics() {
  self.postMessage({
    rpc: RUNTIME_BRIDGE,
    replyTo: 'receiveMilkyWayFogTexture',
    options: {
      fn: 'loadAsset',
      assetName: 'fogColumn',
      catalogFunction: 'getSmokeImage',
    },
  });

  self.postMessage({
    rpc: RUNTIME_BRIDGE,
    replyTo: 'receiveMilkyWayModel',
    options: {
      fn: 'loadAsset',
      assetName: 'milky_way',
      catalogFunction: 'getStarCatalog',
    },
  });

  self.postMessage({
    rpc: RUNTIME_BRIDGE,
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
    const clouds = new SpaceClouds({
      datasetMode: true,
      scene,
      fogTexture: inbound.starFogTexture,
      galaxyMeshUrl: inbound.galaxyModel,
    });
    onReceiveStarFogTexture.getOnce(() => {
      clouds.onSolPosition.getOnce((position) => {
        new StarGenerator({
          scene,
          stars: inbound.realStarData,
          solPosition: position,
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

function animate() {
  // TODO: delete me; just here for testing purposes.
  // camera.position.z -= 0.0002;
  // renderer.render(scene, camera);
  // // this.bloomComposer.render();
  finalComposer.render();

  if (self.requestAnimationFrame) {
    self.requestAnimationFrame(animate);
  }
}

// -------------------------------------------------------------- //

const endpoints = {
  init: init,
  receivePositionalInfo: receivePositionalInfo,
  receiveRealStarData: receiveRealStarData,
  receiveMilkyWayModel: receiveMilkyWayModel,
  receiveMilkyWayFogTexture: receiveMilkyWayFogTexture,
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
