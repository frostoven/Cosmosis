/**
 * This system manages both built-in and community plugins. Plugins specify
 * which other plugins they depend on, and are loaded only when appropriate.
 * Plugins may also duck-punch other plugins, and replace their classes
 * pre-init. Built-ins are located in the built-ins subdirectory next to this
 * file, community plugins are loaded from the pluginCommunity directory in the
 * project root.
 */

import PluginLoader from './classes/PluginLoader';

// @ts-ignore
// This is where community plugins store their classes.
window.$plugin = {};

function loadPlugins() {
  const pluginLoader = new PluginLoader();
  pluginLoader.start();
}

export {
  loadPlugins,
}
