/**
 * This system manages both built-in and community plugins. Plugins specify
 * which other plugins they depend on, and are loaded only when appropriate.
 * Plugins may also duck-punch other plugins, and replace their classes
 * pre-init. Built-ins are located in the built-ins subdirectory next to this
 * file, community plugins are loaded from the pluginCommunity directory in the
 * project root.
 */

import { gameRuntime } from './gameRuntime';
import CosmosisPlugin from './types/CosmosisPlugin';
import PluginLoader from './types/PluginLoader';

const pluginLoader = new PluginLoader();

function loadPlugins(onLoaded: Function) {
  pluginLoader.start(onLoaded);
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
window.$gameRuntime = gameRuntime;

// --- Globals end --- //

export {
  pluginLoader,
  loadPlugins,
}
