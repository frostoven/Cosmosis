/**
 * This system manages both built-in and community plugins. Plugins specify
 * which other plugins they depend on, and are loaded only when appropriate.
 * Plugins may also duck-punch other plugins, and replace their classes
 * pre-init. Built-ins are located in the built-ins subdirectory next to this
 * file, community plugins are loaded from the pluginCommunity directory in the
 * project root.
 */

import { gameState } from './earlyLoad';
import ChangeTracker from '../emitters/ChangeTracker';
import CosmosisPlugin from './types/CosmosisPlugin';
import PluginLoader from './types/PluginLoader';

function loadPlugins(onLoaded: Function) {
  const pluginLoader = new PluginLoader();
  pluginLoader.start(onLoaded);
}

/**
 * @param trackedName - The JS variable name you want to identify this item
 * with.
 */
function preparePlugin(trackedName: string) {
  return gameState.tracked[trackedName] = new ChangeTracker();
}

// --- Globals exposed to community modders --- //

// @ts-ignore
// This is where community plugins store their classes.
window.$CosmosisPlugin = CosmosisPlugin;

// @ts-ignore
// This is where community plugins store their classes.
window.$earlyPlugin = {};

// @ts-ignore
// This is where community plugins store their classes.
window.$latePlugin = {};

// @ts-ignore
// This is where community plugins store their classes.
window.$preparePlugin = preparePlugin;

// @ts-ignore
// This is where community plugins store their classes.
window.$gameState = gameState;

// --- Globals end --- //

export {
  loadPlugins,
  preparePlugin,
}
