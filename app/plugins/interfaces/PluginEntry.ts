import CosmosisPlugin from '../types/CosmosisPlugin';

interface PluginEntry {
  name: string,
  dependencies?: Array<string>,
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
