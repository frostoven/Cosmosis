import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import Core from '../Core';
import Player from '../Player';
import {
  SBA_LENGTH, ROT_W, ROT_X, ROT_Y, ROT_Z, BUFFER_TYPE, TYPE_POSITIONAL_DATA,
} from '../../../webWorkers/sharedBufferArrayConstants';
import MeshLoader from '../NodeOps/types/MeshLoader';
import { gameRuntime } from '../../gameRuntime';
import {
  extractAndPopulateVerts,
  extractVertsFromGeo,
} from '../../../local/mathUtils';
import SpaceClouds from './types/SpaceClouds';

const smokeSprites = [
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke1.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke2.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3b.png'),
];

for (let i = 0, len = smokeSprites.length; i < len; i++) {
  const sprite = smokeSprites[i];
  // TODO: Upgrade three.js to gain access to this.
  // sprite.colorSpace = THREE.SRGBColorSpace;
}

type PluginCompletion = PluginCacheTracker & {
  player: Player, core: Core,
};

class OffscreenGalaxyWorker extends Worker {
  private _pluginTracker!: PluginCacheTracker | PluginCompletion;
  private transferablePosition!: Float64Array;

  constructor() {
    // Note: offscreenGalaxy.js is generated by Webpack. The actual source file
    // is located at: app/webWorkers/offscreenGalaxy.ts
    super('./build/offscreenGalaxy.js', { type: 'module' });

    // const loader = new MeshLoader('milky_way', 'getStarCatalog', {
    new SpaceClouds();

    return;

    this.addEventListener('message', this.receiveMessage.bind(this));
    this._init();

    this.transferablePosition = new Float64Array(SBA_LENGTH);

    this._pluginTracker = new PluginCacheTracker([ 'core', 'player' ]);
    this._pluginTracker.onAllPluginsLoaded.getOnce(() => {
      this._pluginTracker.core.onAnimate.getEveryChange(() => {
        const cam: THREE.PerspectiveCamera = this._pluginTracker.player.camera;
        if (!cam) {
          return;
        }
        this.sendPositionalInfo(cam);
      });
    });
  }

  _init() {
    // @ts-ignore
    const canvas: HTMLCanvasElement = document.getElementById('galaxy-canvas');
    if (!canvas || !('transferControlToOffscreen' in canvas)) {
      // TODO: handle this better. Or not - we choose the NW.js version, and
      //  won't choose something that doesn't boot. Needs thought.
      console.error('[OffscreenGalaxyWorker] Error creating offscreen canvas.');
      return;
    }

    // TODO: on resize, post a message telling to change size.
    // @ts-ignore
    const offscreen = canvas.transferControlToOffscreen();
    this.postMessage({
      endpoint: 'init',
      drawingSurface: offscreen,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      path: '..',
    }, [ offscreen ]);
  }

  receiveMessage(message) {
    const data = message.data;
    if (data.buffer) {
      this.transferablePosition = data;
    }
    else {
      console.warn('[OffscreenGalaxyWorker] Posted message not understood.');
    }
  }

  sendPositionalInfo(camera: THREE.PerspectiveCamera) {
    const bufferArray = this.transferablePosition;

    if (!bufferArray.byteLength) {
      // Variable is currently locked by another thread and is not usable.
      return;
    }

    const quaternion = camera.quaternion;

    bufferArray[BUFFER_TYPE] = TYPE_POSITIONAL_DATA;
    bufferArray[ROT_X] = quaternion.x;
    bufferArray[ROT_Y] = quaternion.y;
    bufferArray[ROT_Z] = quaternion.z;
    bufferArray[ROT_W] = quaternion.w;

    this.postMessage(bufferArray, [ bufferArray.buffer ]);
  }
}

const offscreenGalaxyWorkerPlugin = new CosmosisPlugin('offscreenGalaxyWorker', OffscreenGalaxyWorker);

export {
  OffscreenGalaxyWorker,
  offscreenGalaxyWorkerPlugin,
}
