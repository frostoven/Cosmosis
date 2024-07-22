// @formatter:off
// ^ This file become much harder to read when formatted.

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
import { helmControlPlugin } from './built-ins/modes/playerControllers/HelmControl';
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
import { buckledPassengerPlugin } from './built-ins/modes/playerControllers/BuckledPassenger';
import { localSpacePlugin } from './built-ins/LocalSpace';
import { postBootChecksPlugin } from './built-ins/PostBootChecks/PostBootChecks';
import { gameMenuPlugin } from './built-ins/modes/menuControllers/GameMenu';
import { navMenuPlugin } from './built-ins/modes/menuControllers/Navigation';

const builtInPluginsEnabled: PluginEntry[] = [
  // General
  { name: 'metadata', pluginInstance: metadataPlugin },
  { name: 'core', pluginInstance: corePlugin },
  { name: 'nodeOps', pluginInstance: nodeOpsPlugin },
  { name: 'player', pluginInstance: playerPlugin },

  // Universe
  { name: 'spacetimeControl', pluginInstance: spacetimeControl },
  { name: 'navigation', pluginInstance: navigationPlugin },
  { name: 'levelScene', pluginInstance: levelScenePlugin, dependencies: [ 'core', 'nodeOps', 'spacetimeControl', 'player' ], optional: [ 'shipModuleHub' ] },
  { name: 'spaceScene', pluginInstance: spaceScenePlugin, dependencies: [ 'core', 'spacetimeControl' ] },
  { name: 'localSpace', pluginInstance: localSpacePlugin, dependencies: [ 'core', 'player', 'spacetimeControl', 'spaceScene' ] },
  { name: 'offscreenGalaxyWorker', pluginInstance: offscreenGalaxyWorkerPlugin, dependencies: [ 'core', 'player', 'spaceScene' ] },

  // HUD and control visuals
  { name: 'hud3D', pluginInstance: hud3DPlugin, dependencies: [ 'nodeOps', 'levelScene', 'player' ] },

  // Input
  { name: 'mouseDriver', pluginInstance: mouseDriverPlugin, dependencies: [ 'core' ] },
  { name: 'inputManager', pluginInstance: inputManagerPlugin, dependencies: [ 'core', 'mouseDriver' ] },
  { name: 'gamepadConnector', pluginInstance: gamepadConnectorPlugin, dependencies: [ 'core', 'inputManager' ] },

  // React UI
  { name: 'reactBase', pluginInstance: reactBasePlugin, dependencies: [ 'core', 'inputManager' ] },
  { name: 'gameMenu', pluginInstance: gameMenuPlugin, dependencies: [ 'reactBase' ] },
  { name: 'navMenu', pluginInstance: navMenuPlugin, dependencies: [ 'reactBase', 'player' ] },

  // Modes
  { name: 'generalControl', pluginInstance: generalControlPlugin, dependencies: [ 'inputManager', 'reactBase' ] },
  { name: 'freeCam', pluginInstance: freeCamPlugin, dependencies: [ 'player', 'inputManager' ] },
  { name: 'buckledPassenger', pluginInstance: buckledPassengerPlugin, dependencies: [ 'player', 'inputManager' ] },
  { name: 'helmControl', pluginInstance: helmControlPlugin, dependencies: [ 'player', 'inputManager', 'levelScene' ], optional: [ 'buckledPassenger', 'freeCam' ] },

  // ------------------------------------------------------------ //

  // Ship modules
  { name: 'electricalHousingModule', pluginInstance: electricalHousingModulePlugin },

  // Engine modules
  { name: 'propulsionManagerModule', pluginInstance: propulsionManagerModulePlugin },
  { name: 'warpDriveModule', pluginInstance: warpDriveModulePlugin, dependencies: [ 'helmControl', 'propulsionManagerModule' ] },

  // Power modules
  { name: 'generatorModule', pluginInstance: generatorModulePlugin },

  // Low power modules
  { name: 'visorHudModule', pluginInstance: visorHudModulePlugin, dependencies: [ 'player', 'hud3D','nodeOps' ] },
  { name: 'cockpitLightsModule', pluginInstance: cockpitLightsModulePlugin, dependencies: [ 'helmControl', 'nodeOps' ] },
  { name: 'externalLightsModule', pluginInstance: externalLightsModulePlugin, dependencies: [ 'helmControl', 'nodeOps', 'cockpitLightsModule' ] },
  { name: 'multimeterModule', pluginInstance: multimeterModulePlugin },

  // Trailing plugins - these need to have access to all modules due to the
  // dynamic nature of their subcomponents.
  { name: 'shipModuleHub', pluginInstance: shipModuleHubPlugin, dependencies: [ '*' ] },

  // ------------------------------------------------------------ //

  // // Dev plugins
  { name: 'devGimbal', pluginInstance: devGimbalPlugin, dependencies: [ 'core', 'player' ] },
  { name: 'postBootChecks', pluginInstance: postBootChecksPlugin, dependencies: [ '*' ] },
];

generatePluginCompletion(builtInPluginsEnabled, 'PluginNames');

export {
  builtInPluginsEnabled,
}
