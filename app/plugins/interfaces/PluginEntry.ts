import CosmosisPlugin from '../types/CosmosisPlugin';

interface PluginEntry {
  name: string,
  // Dependencies that have to be satisfied before the plugin will load.
  dependencies?: Array<string>,
  // Dependencies the plugin *may* use, but doesn't rely on.
  optional?: Array<string>,
  // This is strictly for built-ins. External plugins are loaded from
  // window.$plugin.
  pluginInstance?: CosmosisPlugin,
  // Defaults to 3000ms. This does not kill your plugin - it simply emits a
  // warning message indicating that something is taking long.
  timeoutWarn?: number,
}

export {
  PluginEntry,
}
