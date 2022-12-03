import { PluginEntry } from './interfaces/PluginEntry';
import { metaDataPlugin } from './built-ins/MetaData';
import { playerPlugin } from './built-ins/Player';

const builtInPluginsEnabled: PluginEntry[] = [
  { name: 'metaData', pluginInstance: metaDataPlugin },
  { name: 'player', pluginInstance: playerPlugin },
  // { name: 'levelScene' },
  // { name: 'spaceScene' },
  // { name: 'playerShip' },
];

export {
  builtInPluginsEnabled,
}
