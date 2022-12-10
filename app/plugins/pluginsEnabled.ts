import { PluginEntry } from './interfaces/PluginEntry';
import { metadataPlugin } from './built-ins/Metadata';
import { playerPlugin } from './built-ins/Player';
import { locationPlugin } from './built-ins/Location';
import { navigationPlugin } from './built-ins/Navigation';
import { levelScenePlugin } from './built-ins/LevelScene';
import { spaceScenePlugin } from './built-ins/SpaceScene';
import { corePlugin } from './built-ins/Core';
import { mouseDriverPlugin } from './built-ins/MouseDriver';
import { inputManagerPlugin } from './built-ins/InputManager';
import { freeCamPlugin } from './built-ins/modes/playerControllers/FreeCam';
import { generalControlPlugin } from './built-ins/modes/appControllers/GeneralControl';
import { shipPilotPlugin } from './built-ins/modes/playerControllers/ShipPilot';

const builtInPluginsEnabled: PluginEntry[] = [
  { name: 'metadata', pluginInstance: metadataPlugin },
  { name: 'core', pluginInstance: corePlugin },
  { name: 'player', pluginInstance: playerPlugin, dependencies: [ 'core' ] },

  { name: 'levelScene', pluginInstance: levelScenePlugin, dependencies: [ 'core' ] },
  { name: 'spaceScene', pluginInstance: spaceScenePlugin, dependencies: [ 'core' ] },
  { name: 'location', pluginInstance: locationPlugin, dependencies: [ 'core', 'player', 'levelScene', 'spaceScene' ] },
  { name: 'navigation', pluginInstance: navigationPlugin, dependencies: [ 'core', 'location' ] },

  { name: 'mouseDriver', pluginInstance: mouseDriverPlugin, dependencies: [ 'core', 'player' ] },
  { name: 'inputManager', pluginInstance: inputManagerPlugin, dependencies: [ 'core', 'mouseDriver' ] },
  { name: 'generalControl', pluginInstance: generalControlPlugin, dependencies: [ 'inputManager' ] },
  { name: 'freeCam', pluginInstance: freeCamPlugin, dependencies: [ 'player', 'inputManager' ] },
  { name: 'shipPilot', pluginInstance: shipPilotPlugin, dependencies: [ 'player', 'inputManager', 'levelScene' ] },
];

export {
  builtInPluginsEnabled,
}
