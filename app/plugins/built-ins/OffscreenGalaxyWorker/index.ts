import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import Core from '../Core';
import Player from '../Player';
import {
  BUFFER_TYPE,
  ROT_W,
  ROT_X,
  ROT_Y,
  ROT_Z,
  API_BRIDGE_REQUEST,
  SBA_LENGTH,
  SEND_SKYBOX,
  TYPE_POSITIONAL_DATA,
  FRONT_SIDE,
  RIGHT_SIDE,
  BACK_SIDE,
  TOP_SIDE,
  BOTTOM_SIDE, LEFT_SIDE, POS_X, POS_Y, POS_Z,
} from './webWorker/sharedBufferArrayConstants';
import WebWorkerRuntimeBridge from '../../../local/WebWorkerRuntimeBridge';
import { gameRuntime } from '../../gameRuntime';
import SpaceScene from '../SpaceScene';
import SpaceClouds from './types/SpaceClouds';
import StarGenerator from './types/StarGenerator';
import fs from 'fs';
import { CanvasTexture, PerspectiveCamera } from 'three';
import userProfile from '../../../userProfile';

const USE_WEB_WORKER = true;

const csmToThree = [
  5, 4, 2, 3, 1, 0,
];

type PluginCompletion = PluginCacheTracker & {
  player: Player, core: Core, spaceScene: SpaceScene,
};

class OffscreenGalaxyWorker extends Worker {
  private _pluginTracker!: PluginCacheTracker | PluginCompletion;
  // private transferablePosition!: Float64Array;
  private bridge: WebWorkerRuntimeBridge;
  private skyboxTextures: THREE.CanvasTexture[] | null[] = [ null, null, null, null, null, null ];
  private canvas!: HTMLElement | null;
  // This is in use only if not using a web worker for visuals.
  public localGalaxyObjects: any = {};

  constructor() {
    // Note: Webpack automatically bundles this from ./webWorker/index.ts. The
    // path is defined in /app/plugins/pluginWebWorkersEnabled.json.
    super('./build/offscreenGalaxy.js', { type: 'module' });

    this.bridge = new WebWorkerRuntimeBridge();
    this.addEventListener('message', this.receiveMessage.bind(this));

    // this.transferablePosition = new Float64Array(SBA_LENGTH);

    this._pluginTracker = new PluginCacheTracker([ 'core', 'player', 'spaceScene' ]);
    this._pluginTracker.onAllPluginsLoaded.getOnce(() => {
      this._pluginTracker.core.onAnimate.getEveryChange(this.step.bind(this));

      if (USE_WEB_WORKER) {
        this.requestSkybox();
      }
      else {
        const scene: SpaceScene = this._pluginTracker.spaceScene;
        if (scene.skybox) {
          scene.skybox.visible = false;
        }
      }
      this._init();
    });
    // setInterval(() => {
    //   this.requestSkybox();
    // }, 1000);
  }

  _init() {
    this.canvas = document.getElementById('galaxy-canvas');
    if (!this.canvas) {
      console.error('[OffscreenGalaxyWorker] Error creating canvas.');
      return;
    }

    if (USE_WEB_WORKER) {
      return this.sendCanvasOffscreen();
    }

    // const scene: SpaceScene = this._pluginTracker.spaceScene;

    // Note: the rest of this function is for debugging and previewing
    // purposes. I doubt we'll move away from the skybox model for any normal
    // cases, though we may end up hybridizing them later.
    const { display } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });
    let galacticClouds: SpaceClouds, galacticStars: StarGenerator;
    const scene = new THREE.Scene();
    const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      powerPreference: "high-performance",
      // antialias: false,
      stencil: false,
      depth: false,
      //
      // alpha: true,
      // antialias: true,
      // preserveDrawingBuffer: true,
      // powerPreference: "high-performance",
    });

    const fogTexture = new THREE.TextureLoader().load('potatoLqAssets/smokeImg/fogColumn.png');
    // @ts-ignore
    const stars = JSON.parse(fs.readFileSync('prodHqAssets/starCatalogs/bsc5p_3d_min.json'));

    // const ab = new ArrayBuffer(data.buffer.byteLength);
    // const galaxyMeshUrl = Int32Array.from(data);
    // const ab = new ArrayBuffer(data.buffer.byteLength);
    // new Uint8Array(ab).set(new Uint8Array(ab));
    // const galaxyMeshUrl = data.buffer;
    const galaxyMeshUrl = 'potatoLqAssets/starCatalogs/milky_way.glb';

    galacticClouds = new SpaceClouds({
      datasetMode: false,
      scene,
      fogTexture: fogTexture as CanvasTexture,
      galaxyMeshUrl,
    });

    galacticClouds.onSolPosition.getOnce((position) => {
      galacticStars = new StarGenerator({
        scene,
        stars,
        solPosition: position,
      });

      galacticStars.onStarGeneratorReady.getOnce(() => {
        galacticClouds.onSpaceCloudsReady.getOnce(() => {
          console.log('Local galaxy loading complete.');

          const container = this.localGalaxyObjects;
          container.fogTexture = fogTexture;
          container.galaxyMeshUrl = galaxyMeshUrl;
          container.stars = stars;
          container.scene = scene;
          container.renderer = renderer;
          container.camera = new PerspectiveCamera(
            display.fieldOfView,
            window.innerWidth / window.innerHeight,
            // Culling is in parsecs.
            0.000001, 1e27,
          );
        });
      });
    });
  }

  sendCanvasOffscreen() {
    if (!this.canvas || !('transferControlToOffscreen' in this.canvas)) {
      console.error('[OffscreenGalaxyWorker] Error creating offscreen canvas.');
      return;
    }

    // @ts-ignore
    const offscreen = this.canvas.transferControlToOffscreen();
    this.postMessage({
      endpoint: 'init',
      canvas: offscreen,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      path: '..',
    }, [ offscreen ]);
  }

  receiveMessage(message: { data: { buffer, rpc, replyTo, options } }) {
    // console.log('OffscreenGalaxyWorker received', { message });
    const data = message.data;
    // if (data.buffer) {
    //   // This allows us to create an oscillating effect where the variable is
    //   // passed back and forth between threads. It's currently unkown which
    //   // produces more lag better bidirectional sharing and recreating
    //   // Float64Array from scratch each frame.
    //   // this.transferablePosition = data;
    // }
    // else {
    const { rpc, replyTo, options, buffer }: {
      rpc: number,
      replyTo: string,
      options: { [key: string]: any },
      buffer: ArrayBuffer | ImageBitmap
    } = data;
      // Skybox requesting data.
      if (rpc === API_BRIDGE_REQUEST) {
        this.bridge.auto(options, (error, { serialData, bufferData }) => {
          if (bufferData) {
            this.postMessage({
              endpoint: replyTo,
              buffer: bufferData.buffer,
              serialData,
            }, [bufferData.buffer]);
          }
          else {
            this.postMessage({
              endpoint: replyTo,
              serialData,
            });
          }
        });
      }
      // Skybox sending data.
      else if (rpc === SEND_SKYBOX) {
        // const start = performance.now();
        const side = options.side;
        const triggerBuild = options.triggerBuild;
        const texture = new THREE.CanvasTexture(buffer as ImageBitmap);
        texture.image = buffer;
        // @ts-ignore
        this.skyboxTextures[csmToThree[side]] = texture;
        // Try to keep this under 1ms. The only real lag should come from
        // offscreen GPU use. This averages 0.09-0.5ms on my laptop, depending
        // on how busy the machine already is.
        // console.log(`[OffscreenGalaxyWorker] side cost the main thread ${(performance.now() - start)}ms.`);

        if (triggerBuild) {
          this.buildSkybox();
        }
      }
      else {
        console.warn(
          '[OffscreenGalaxyWorker] Posted message not understood:', message,
        );
      }
    // }
  }

  sendPositionalInfo(camera: THREE.PerspectiveCamera) {
    const bufferArray = new Float64Array(SBA_LENGTH);

    // if (!bufferArray.byteLength) {
    //   // Variable is currently locked by another thread and is not usable.
    //   return;
    // }

    const quaternion = camera.quaternion;
    const position = camera.position;

    bufferArray[BUFFER_TYPE] = TYPE_POSITIONAL_DATA;
    bufferArray[ROT_X] = quaternion.x;
    bufferArray[ROT_Y] = quaternion.y;
    bufferArray[ROT_Z] = quaternion.z;
    bufferArray[ROT_W] = quaternion.w;
    bufferArray[POS_X] = position.x;
    bufferArray[POS_Y] = position.y;
    bufferArray[POS_Z] = position.z;

    this.postMessage({
      endpoint: 'receivePositionalInfo',
      buffer: bufferArray.buffer,
    }, [ bufferArray.buffer ]);
  }

  requestSkybox() {
    this.postMessage({
      endpoint: 'mainRequestsSkybox',
    });
  }

  buildSkybox() {
    const scene: SpaceScene = this._pluginTracker.spaceScene;
    const start = performance.now();
    scene.setSkyboxSides(this.skyboxTextures as THREE.CanvasTexture[]);
    console.log(`[buildSkybox] applying sides cost the main thread ${(performance.now() - start)}ms.`);
  }

  step() {
    const cam: THREE.PerspectiveCamera = this._pluginTracker.player.camera;
    if (USE_WEB_WORKER) {
      if (!cam) {
        return;
      }
      this.sendPositionalInfo(cam);
    }
    else if (this.localGalaxyObjects.camera) {
      const container = this.localGalaxyObjects;
      const renderer: THREE.WebGLRenderer = container.renderer;
      const subCam: THREE.PerspectiveCamera = container.camera;
      subCam.position.copy(cam.position).multiplyScalar(0.00001);
      subCam.quaternion.copy(cam.quaternion);
      renderer.render(container.scene, container.camera);
    }
  }
}

const offscreenGalaxyWorkerPlugin = new CosmosisPlugin('offscreenGalaxyWorker', OffscreenGalaxyWorker);

export {
  OffscreenGalaxyWorker,
  offscreenGalaxyWorkerPlugin,
}
