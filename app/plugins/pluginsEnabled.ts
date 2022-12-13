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
import { shipModuleHubPlugin } from './built-ins/ShipModuleHub';
import { generatorModulePlugin } from './built-ins/shipModules/Generator';
import { multimeterModulePlugin } from './built-ins/shipModules/Multimeter';
import { electricalHousingModulePlugin } from './built-ins/shipModules/ElectricalHousing';
import { cockpitLightsModulePlugin } from './built-ins/shipModules/CockpitLights';
import { nodeOpsPlugin } from './built-ins/NodeOps';

const builtInPluginsEnabled: PluginEntry[] = [
  // General
  { name: 'metadata', pluginInstance: metadataPlugin },
  { name: 'core', pluginInstance: corePlugin },
  { name: 'nodeOps', pluginInstance: nodeOpsPlugin },
  { name: 'player', pluginInstance: playerPlugin, dependencies: [ 'core' ] },

  // Universe
  { name: 'levelScene', pluginInstance: levelScenePlugin, dependencies: [ 'core', 'nodeOps' ], optional: [ 'shipModuleHub' ] },
  { name: 'spaceScene', pluginInstance: spaceScenePlugin, dependencies: [ 'core' ] },
  { name: 'location', pluginInstance: locationPlugin, dependencies: [ 'core', 'player', 'levelScene', 'spaceScene' ] },
  { name: 'navigation', pluginInstance: navigationPlugin, dependencies: [ 'core', 'location' ] },

  // Input
  { name: 'mouseDriver', pluginInstance: mouseDriverPlugin, dependencies: [ 'core', 'player' ] },
  { name: 'inputManager', pluginInstance: inputManagerPlugin, dependencies: [ 'core', 'mouseDriver' ] },
  { name: 'generalControl', pluginInstance: generalControlPlugin, dependencies: [ 'inputManager' ] },
  { name: 'freeCam', pluginInstance: freeCamPlugin, dependencies: [ 'player', 'inputManager' ] },
  { name: 'shipPilot', pluginInstance: shipPilotPlugin, dependencies: [ 'player', 'inputManager', 'levelScene' ] },

  // Ship modules
  { name: 'electricalHousingModule', pluginInstance: electricalHousingModulePlugin },
  { name: 'generatorModule', pluginInstance: generatorModulePlugin },
  { name: 'cockpitLightsModule', pluginInstance: cockpitLightsModulePlugin, dependencies: [ 'shipPilot', 'nodeOps' ] },
  { name: 'multimeterModule', pluginInstance: multimeterModulePlugin },

  // Ship module hub
  // Always place this last. The module hub should have programmatic access to
  // all ship modules.
  { name: 'shipModuleHub', pluginInstance: shipModuleHubPlugin, dependencies: [ '*' ] },
];

export {
  builtInPluginsEnabled,
}
