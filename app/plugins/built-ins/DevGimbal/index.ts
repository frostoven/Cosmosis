import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import Core from '../Core';
import Player from '../Player';
import LevelScene from '../LevelScene';
import MeshLoader from '../NodeOps/types/MeshLoader';
import { Object3D } from 'three';

const pi = Math.PI;

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  player: Player,
  levelScene: LevelScene,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: THREE.Camera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------


class DevGimbal {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  private _mesh!: Object3D;
  private _positiveX!: Object3D;
  private _positiveY!: Object3D;
  private _positiveZ!: Object3D;

  constructor() {
    const loader = new MeshLoader('gimbal');
    loader.getHudModel().trackedMesh.getOnce(({ gltf }) => {
      this._mesh = gltf.scene;
      this._mesh.traverse((node) => {
        node.name === 'x' && (this._positiveX = node);
        node.name === 'y' && (this._positiveY = node);
        node.name === 'z' && (this._positiveZ = node);
      });

      const camera = this._pluginCache.player.camera;
      camera.add(this._mesh);
      this._mesh.scale.set(0.005, 0.005, 0.005);
      this._mesh.translateZ(-0.05);
      this._mesh.translateY(0.0235);

      this._pluginCache.core.onAnimate.getEveryChange(() => {
        this.render();
      });
    });
  }

  render() {
    const camera = this._pluginCache.camera;
    const levelScene = this._pluginCache.levelScene;
    if (!camera || !levelScene) {
      return;
    }
    levelScene.attach(this._mesh);
    this._mesh.quaternion.set(0, 0, 0, 1);
    //
    this._positiveX.lookAt(camera.position);
    this._positiveY.lookAt(camera.position);
    this._positiveZ.lookAt(camera.position);
    //
    this._positiveX.rotateY(pi);
    this._positiveY.rotateY(pi);
    this._positiveZ.rotateY(pi);
    //
    camera.attach(this._mesh);
  }
}

const devGimbalPlugin = new CosmosisPlugin('devGimbal', DevGimbal);

export {
  DevGimbal,
  devGimbalPlugin,
};
