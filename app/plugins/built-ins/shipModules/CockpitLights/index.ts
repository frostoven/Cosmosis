import CosmosisPlugin from '../../../types/CosmosisPlugin';
import ModuleSpawner from '../types/ModuleSpawner';
import CockpitLights from './types/CockpitLights';
import { gameRuntime } from '../../../gameRuntime';
import { ShipPilot } from '../../modes/playerControllers/ShipPilot';
import { cockpitLightControls } from './controls';

class CockpitLightsModule extends ModuleSpawner {
  constructor() {
    super();
    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      shipPilot.extendControlSchema(cockpitLightControls);
    });
  }
  createPart() {
    return new CockpitLights();
  }
}

const cockpitLightsModulePlugin = new CosmosisPlugin('cockpitLightsModule', CockpitLightsModule);

export {
  CockpitLightsModule,
  cockpitLightsModulePlugin,
}
