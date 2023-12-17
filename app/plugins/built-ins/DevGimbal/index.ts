import CosmosisPlugin from '../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import Core from '../Core';
import Player from '../Player';
import LevelScene from '../LevelScene';
import MeshLoader from '../NodeOps/types/MeshLoader';
import { Object3D, PerspectiveCamera } from 'three';

const pi = Math.PI;

type PluginCompletion = PluginCacheTracker & {
  player: Player, core: Core, levelScene: LevelScene,
};

class DevGimbal {
  private _pluginTracker: PluginCacheTracker | PluginCompletion;
  private _mesh!: Object3D;
  private _positiveX!: Object3D;
  private _positiveY!: Object3D;
  private _positiveZ!: Object3D;
  private _negativeX!: Object3D;
  private _negativeY!: Object3D;
  private _negativeZ!: Object3D;
  constructor() {
    this._pluginTracker = new PluginCacheTracker([ 'core', 'player', 'levelScene' ]);
    this._pluginTracker.onAllPluginsLoaded.getOnce(() => this._init());
  }

  _init = () => {
    const loader = new MeshLoader('gimbal');
    loader.getHudModel().trackedMesh.getOnce(({ gltf }) => {
      this._mesh = gltf.scene;
      this._mesh.traverse((node) => {
        node.name === 'x' && (this._positiveX = node);
        node.name === 'y' && (this._positiveY = node);
        node.name === 'z' && (this._positiveZ = node);
        //
        // node.name === 'negativeX' && (this._negativeX = node);
        // node.name === 'negativeY' && (this._negativeY = node);
        // node.name === 'negativeZ' && (this._negativeZ = node);
      });

      this._pluginTracker.onAllPluginsLoaded.getOnce(() => {
        const camera = this._pluginTracker.player.camera;
        camera.add(this._mesh);
        this._mesh.scale.set(0.005, 0.005, 0.005);
        this._mesh.translateZ(-0.05);
        this._mesh.translateY(0.0235);

        this._pluginTracker.core.onAnimate.getEveryChange(({ delta }) => {
          this.render(delta);
        });
      });
    });
  };

  render(delta) {
    const camera: PerspectiveCamera = this._pluginTracker.player.camera;
    const levelScene: PerspectiveCamera = this._pluginTracker.levelScene;
    if (!camera || !levelScene) {
      return;
    }
    // this._mesh.rotation.setFromQuaternion(camera.quaternion);
    // this._mesh.rotation.x = 0;
    // this._mesh.rotation.z = 0;
    levelScene.attach(this._mesh);
    this._mesh.quaternion.set(0, 0, 0, 1);
    //
    this._positiveX.lookAt(camera.position);
    this._positiveY.lookAt(camera.position);
    this._positiveZ.lookAt(camera.position);
    //
    // this._negativeX.lookAt(camera.position);
    // this._negativeY.lookAt(camera.position);
    // this._negativeZ.lookAt(camera.position);
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
}
