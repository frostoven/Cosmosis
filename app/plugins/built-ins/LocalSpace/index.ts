import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import Player from '../Player';
import { Camera } from 'three';
import SpaceScene from '../SpaceScene';
import { Sol } from './SceneOverrides/scenes/Sol';
import { SpacetimeControl } from '../SpacetimeControl';

type PluginCompletion = PluginCacheTracker | {
  player: Player,
  spacetimeControl: SpacetimeControl,
  spaceScene: SpaceScene,
  camera: Camera,
};

class LocalSpace {
  private _pluginCache: PluginCompletion;

  constructor() {
    this._pluginCache = new PluginCacheTracker(
      [ 'player', 'spacetimeControl', 'spaceScene' ],
      { player: { camera: 'camera' } },
    );
    this._pluginCache.onAllPluginsLoaded.getOnce(() => {
      // TODO: Create an octree to determine if our current position in space
      //  has a custom scene associated with it. For initial testing, we're
      //  hard-coding Sol.
      const spaceScene = this._pluginCache.spaceScene;
      const sol = new Sol(spaceScene);
      sol.activate();

      // TODO: Remove me.
      // console.log('spacetimeControl:', this._pluginCache.spacetimeControl);
      this._pluginCache.spacetimeControl.teleportShipToLocalLocation(
        new THREE.Vector3(0, 0, -29_798_550_000), // very close
        // new THREE.Vector3(0, 0,   -107_620_000_700), // venus's distance to the sun.
        // new THREE.Vector3(0, 0,   -149_597_870_700), // earth's distance to the sun.
        // new THREE.Vector3(0, 0, -1_448_400_000_000), // saturn's distance.
      );
    });
  }
}

const localSpacePlugin = new CosmosisPlugin('localSpace', LocalSpace);

export {
  LocalSpace,
  localSpacePlugin,
};