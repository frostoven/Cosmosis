import CosmosisPlugin from '../../../types/CosmosisPlugin';
import Generator from './types/Generator';
import ModuleSpawner from '../types/ModuleSpawner';

class GeneratorModule extends ModuleSpawner {
  createPart() {
    return new Generator();
  }
}

const generatorModulePlugin = new CosmosisPlugin('generatorModule', GeneratorModule);

export {
  GeneratorModule,
  generatorModulePlugin,
}
