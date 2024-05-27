import CosmosisPlugin from '../../../types/CosmosisPlugin';
import PropulsionManager from './types/PropulsionManager';
import ModuleSpawner from '../types/ModuleSpawner';

class PropulsionManagerModule extends ModuleSpawner {
  createPart({ eciRegistration }) {
    return new PropulsionManager({ eciRegistration });
  }
}

const propulsionManagerModulePlugin = new CosmosisPlugin(
  'propulsionManagerModule', PropulsionManagerModule,
);

export {
  PropulsionManagerModule,
  propulsionManagerModulePlugin,
};
