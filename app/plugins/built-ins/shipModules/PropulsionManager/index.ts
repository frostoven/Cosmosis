import CosmosisPlugin from '../../../types/CosmosisPlugin';
import PropulsionManager from './types/PropulsionManager';
import ModuleSpawner from '../types/ModuleSpawner';

class PropulsionManagerModule extends ModuleSpawner {
  createPart() {
    return new PropulsionManager();
  }
}

const propulsionManagerModulePlugin = new CosmosisPlugin('propulsionManagerModule', PropulsionManagerModule);

export {
  PropulsionManagerModule,
  propulsionManagerModulePlugin,
}
