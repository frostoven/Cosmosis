import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import Player from '../Player';
import { Camera } from 'three';
import SpaceScene from '../SpaceScene';
import { Sol } from './SceneOverrides/scenes/Sol';
import { SpacetimeControl } from '../SpacetimeControl';
import { logBootTitleAndInfo } from '../../../local/windowLoadListener';
import PluginLoader from '../../types/PluginLoader';
import { gameRuntime } from '../../gameRuntime';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  player: Player,
  spacetimeControl: SpacetimeControl,
  spaceScene: SpaceScene,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: THREE.Camera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------

class LocalSpace {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  constructor() {
    logBootTitleAndInfo('Driver', 'Astrometrics Interface', PluginLoader.bootLogIndex);

    // TODO: Create an octree to determine if our current position in space
    //  has a custom scene associated with it. For initial testing, we're
    //  hard-coding Sol.
    const sol = new Sol(this._pluginCache.spaceScene);
    sol.activate();

    // TODO: Remove me.
    gameRuntime.tracked.spacetimeControl.cachedValue.teleportShipToLocalLocation(
      new THREE.Vector3(-50_571_314_000, -45_289_075_000, -81_640_330),
    );

    // TODO: Remove me. Here for testing purposes only.
    setTimeout(() => {
      this._pluginCache.spacetimeControl.rotatePlayerCentric(0, 3.14, 3.14 * 0.75);
    }, 2000);
  }
}

const localSpacePlugin = new CosmosisPlugin('localSpace', LocalSpace);

export {
  LocalSpace,
  localSpacePlugin,
};
