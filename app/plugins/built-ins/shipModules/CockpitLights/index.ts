import CosmosisPlugin from '../../../types/CosmosisPlugin';
import ModuleSpawner from '../types/ModuleSpawner';
import CockpitLights from './types/CockpitLights';
import { gameRuntime } from '../../../gameRuntime';
import { HelmControl } from '../../modes/playerControllers/HelmControl';
import { cockpitLightControls } from './controls';

class CockpitLightsModule extends ModuleSpawner {
  constructor() {
    super();

    gameRuntime.tracked.helmControl.getOnce((helmControl: HelmControl) => {
      helmControl.extendControlSchema(cockpitLightControls);
    });
  }

  createPart({ inventory }) {
    return new CockpitLights({ inventory });
  }
}

const cockpitLightsModulePlugin = new CosmosisPlugin('cockpitLightsModule', CockpitLightsModule);

export {
  CockpitLightsModule,
  cockpitLightsModulePlugin,
}
