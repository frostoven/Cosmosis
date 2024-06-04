import CosmosisPlugin from '../../../types/CosmosisPlugin';
import ModuleSpawner from '../types/ModuleSpawner';
import ExternalLights from './types/ExternalLights';
import { gameRuntime } from '../../../gameRuntime';
import { HelmControl } from '../../modes/playerControllers/HelmControl';
import { externalLightControls } from './controls';

class ExternalLightsModule extends ModuleSpawner {
  constructor() {
    super();

    gameRuntime.tracked.helmControl.getOnce((helmControl: HelmControl) => {
      helmControl.extendControlSchema(externalLightControls);
    });
  }

  createPart({ inventory }) {
    return new ExternalLights({ inventory });
  }
}

const externalLightsModulePlugin = new CosmosisPlugin('externalLightsModule', ExternalLightsModule);

export {
  ExternalLightsModule,
  externalLightsModulePlugin,
}
