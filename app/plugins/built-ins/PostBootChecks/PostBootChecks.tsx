import fs from 'fs';
import React from 'react';
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

class PostBootChecks {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;

  constructor() {
  }
}

const postBootChecksPlugin = new CosmosisPlugin(
  'postBootChecks', PostBootChecks, pluginDependencies,
);

export {
  PostBootChecks,
  postBootChecksPlugin,
};
