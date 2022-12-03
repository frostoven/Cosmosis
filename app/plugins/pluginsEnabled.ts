import { PluginEntry } from './interfaces/PluginEntry';
import { playerPlugin } from './built-ins/Player';

const builtInPluginsEnabled: PluginEntry[] = [
  {
    name: 'player',
    pluginInstance: playerPlugin,
  }
  // {
  //   name: 'levelScene',
  // },
  // {
  //   name: 'spaceScene',
  // },
  // {
  //   name: 'playerShip',
  // },
];

export {
  builtInPluginsEnabled,
}
