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

type PluginCompletion = PluginCacheTracker | {
  player: Player,
  spacetimeControl: SpacetimeControl,
  spaceScene: SpaceScene,
  camera: Camera,
};

class LocalSpace {
  private _pluginCache: PluginCompletion;

  constructor() {
    logBootTitleAndInfo('Driver', 'Astrometrics Interface', PluginLoader.bootLogIndex);
    this._pluginCache = new PluginCacheTracker(
      [ 'player', 'spacetimeControl', 'spaceScene' ],
      { player: { camera: 'camera' } },
    );
    this._pluginCache.onAllPluginsLoaded.getOnce(() => {
      // TODO: Create an octree to determine if our current position in space
      //  has a custom scene associated with it. For initial testing, we're
      //  hard-coding Sol.
      const sol = new Sol(this._pluginCache.spaceScene);
      sol.activate();

      // TODO: Remove me. Here for testing purposes only.
      setTimeout(() => {
        this._pluginCache.spacetimeControl.rotatePlayerCentric(-0.2, 3.14, 3.14 * 0.75);
      }, 2000);
    });
  }
}

const localSpacePlugin = new CosmosisPlugin('localSpace', LocalSpace);

export {
  LocalSpace,
  localSpacePlugin,
};
