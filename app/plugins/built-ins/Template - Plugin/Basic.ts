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
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

class Template {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;

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
