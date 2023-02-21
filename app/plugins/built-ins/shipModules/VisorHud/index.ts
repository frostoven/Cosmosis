import CosmosisPlugin from '../../../types/CosmosisPlugin';
import VisorHud from './types/VisorHud';
import ModuleSpawner from '../types/ModuleSpawner';

class VisorHudModule extends ModuleSpawner {
  createPart() {
    return new VisorHud();
  }
}

const visorHudModulePlugin = new CosmosisPlugin('visorHudModule', VisorHudModule);

export {
  VisorHudModule,
  visorHudModulePlugin,
}
