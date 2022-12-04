import { PluginEntry } from './interfaces/PluginEntry';
import { metadataPlugin } from './built-ins/Metadata';
import { playerPlugin } from './built-ins/Player';
import { locationPlugin } from './built-ins/Location';
import { navigationPlugin } from './built-ins/Navigation';

const builtInPluginsEnabled: PluginEntry[] = [
  { name: 'metadata', pluginInstance: metadataPlugin },
  { name: 'player', pluginInstance: playerPlugin },
  { name: 'location', pluginInstance: locationPlugin, dependencies: [ 'player' ] },
  { name: 'navigation', pluginInstance: navigationPlugin, dependencies: [ 'location' ] },
  // { name: 'levelScene' },
  // { name: 'spaceScene' },
  // { name: 'playerShip' },
];

export {
  builtInPluginsEnabled,
}
