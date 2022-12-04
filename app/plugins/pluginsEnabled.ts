import { PluginEntry } from './interfaces/PluginEntry';
import { metadataPlugin } from './built-ins/Metadata';
import { playerPlugin } from './built-ins/Player';

const builtInPluginsEnabled: PluginEntry[] = [
  { name: 'metadata', pluginInstance: metadataPlugin },
  { name: 'player', pluginInstance: playerPlugin },
  // { name: 'levelScene' },
  // { name: 'spaceScene' },
  // { name: 'playerShip' },
];

export {
  builtInPluginsEnabled,
}
