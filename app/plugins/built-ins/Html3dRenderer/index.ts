import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Core from '../Core';
import Player from '../Player';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import CosmosisPlugin from '../../types/CosmosisPlugin';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  player: Player,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: THREE.PerspectiveCamera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------

class Html3dRenderer {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  private _paused: boolean = false;
  private _scene: THREE.Scene = new THREE.Scene();
  private _renderer: CSS3DRenderer = new CSS3DRenderer();

  constructor() {
    this._renderer.setSize(window.innerWidth, window.innerHeight);

    const css3dRenderSpace = document.getElementById('css3d-render-space');
    if (!css3dRenderSpace) {
      console.error(
        'Failed to set up Css3dRenderer plugin: #css3d-render-space not found.',
      );
    }
    else {
      css3dRenderSpace.appendChild(this._renderer.domElement);
    }

    this._pluginCache.core.appendRenderHook(this.step);
  }

  add(object: THREE.Object3D) {
    this._scene.add(object);
    this._paused = false;
  }

  remove(object: THREE.Object3D) {
    this._scene.remove(object);
  }

  step = () => {
    if (this._paused) {
      return;
    }

    console.log('rendering');
    this._renderer.render(this._scene, this._pluginCache.camera);

    if (!this._scene.children.length) {
      this._paused = true;
    }
  };
}

const html3dRendererPlugin = new CosmosisPlugin(
  'html3dRenderer', Html3dRenderer, pluginDependencies,
);

export {
  Html3dRenderer,
  html3dRendererPlugin,
};
