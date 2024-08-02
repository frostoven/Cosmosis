import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import Core from '../Core';
import Player from '../Player';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';

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

class Template {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  constructor() {
    throw 'Use this class as plugin boilerplate.';
  }
}

const templatePlugin = new CosmosisPlugin(
  'template', Template, pluginDependencies,
);

export {
  Template,
  templatePlugin,
};
