// @formatter:off
// ^ This files become much harder to read when formatted.

import { PluginEntry } from './interfaces/PluginEntry';
import { metadataPlugin } from './built-ins/Metadata';
import { playerPlugin } from './built-ins/Player';
import { spacetimeControl } from './built-ins/SpacetimeControl';
import { navigationPlugin } from './built-ins/Navigation';
import { levelScenePlugin } from './built-ins/LevelScene';
import { spaceScenePlugin } from './built-ins/SpaceScene';
import { hud3DPlugin } from './built-ins/ui/Hud3D';
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
import { externalLightsModulePlugin } from './built-ins/shipModules/ExternalLights';
import { propulsionManagerModulePlugin } from './built-ins/shipModules/PropulsionManager';
import { warpDriveModulePlugin } from './built-ins/shipModules/WarpDrive';
import { gamepadConnectorPlugin } from './built-ins/GamepadConnector';
import { visorHudModulePlugin } from './built-ins/shipModules/VisorHud';
import { generatePluginCompletion } from './generatePluginCompletion';
import { offscreenGalaxyWorkerPlugin } from './built-ins/OffscreenGalaxyWorker';
import { devGimbalPlugin } from './built-ins/DevGimbal';
import { reactBasePlugin } from './built-ins/ReactBase';

const builtInPluginsEnabled: PluginEntry[] = [
  // General
  { name: 'metadata', pluginInstance: metadataPlugin },
  { name: 'core', pluginInstance: corePlugin },
  { name: 'nodeOps', pluginInstance: nodeOpsPlugin },
  { name: 'player', pluginInstance: playerPlugin, dependencies: [ 'core' ] },

  // Universe
  { name: 'spacetimeControl', pluginInstance: spacetimeControl, dependencies: [] },
  { name: 'navigation', pluginInstance: navigationPlugin, dependencies: [ 'core', 'spacetimeControl' ] },
  { name: 'levelScene', pluginInstance: levelScenePlugin, dependencies: [ 'core', 'nodeOps', 'spacetimeControl', 'player' ], optional: [ 'shipModuleHub' ] },
  { name: 'spaceScene', pluginInstance: spaceScenePlugin, dependencies: [ 'core', 'spacetimeControl' ] },
  { name: 'offscreenGalaxyWorker', pluginInstance: offscreenGalaxyWorkerPlugin, dependencies: [ 'core', 'player', 'spaceScene' ] },

  // HUD and control visuals
  { name: 'hud3D', pluginInstance: hud3DPlugin, dependencies: [ 'nodeOps', 'spaceScene', 'player' ] },

  // Input
  { name: 'mouseDriver', pluginInstance: mouseDriverPlugin, dependencies: [ 'core' ] },
  { name: 'gamepadConnector', pluginInstance: gamepadConnectorPlugin, dependencies: [ 'core', 'inputManager' ] },

  // React UI
  { name: 'reactBase', pluginInstance: reactBasePlugin, dependencies: [ 'core', 'inputManager' ] },

  // Modes
  { name: 'inputManager', pluginInstance: inputManagerPlugin, dependencies: [ 'core', 'mouseDriver' ] },
  { name: 'generalControl', pluginInstance: generalControlPlugin, dependencies: [ 'inputManager', 'reactBase' ] },
  { name: 'freeCam', pluginInstance: freeCamPlugin, dependencies: [ 'player', 'inputManager' ] },
  { name: 'shipPilot', pluginInstance: shipPilotPlugin, dependencies: [ 'player', 'inputManager', 'levelScene' ] },

  // ------------------------------------------------------------ //

  // Ship modules
  { name: 'electricalHousingModule', pluginInstance: electricalHousingModulePlugin },

  // Engine modules
  { name: 'propulsionManagerModule', pluginInstance: propulsionManagerModulePlugin },
  { name: 'warpDriveModule', pluginInstance: warpDriveModulePlugin, dependencies: [ 'shipPilot', 'propulsionManagerModule' ] },

  // Power modules
  { name: 'generatorModule', pluginInstance: generatorModulePlugin },

  // Low power modules
  { name: 'visorHudModule', pluginInstance: visorHudModulePlugin, dependencies: [ 'shipPilot', 'nodeOps' ] },
  { name: 'cockpitLightsModule', pluginInstance: cockpitLightsModulePlugin, dependencies: [ 'shipPilot', 'nodeOps' ] },
  { name: 'externalLightsModule', pluginInstance: externalLightsModulePlugin, dependencies: [ 'shipPilot', 'nodeOps', 'cockpitLightsModule' ] },
  { name: 'multimeterModule', pluginInstance: multimeterModulePlugin },

  // Ship module hub
  // Always place this last. The module hub should have programmatic access to
  // all ship modules.
  { name: 'shipModuleHub', pluginInstance: shipModuleHubPlugin, dependencies: [ '*' ] },

  // ------------------------------------------------------------ //

  // Dev plugins
  { name: 'devGimbalPlugin', pluginInstance: devGimbalPlugin, dependencies: [ 'core', 'player' ] },
];

generatePluginCompletion(builtInPluginsEnabled, 'PluginNames');

export {
  builtInPluginsEnabled,
}
