import CosmosisPlugin from '../../../types/CosmosisPlugin';
import Generator from './types/Generator';

class GeneratorModule {
  constructor() {
  }

  createPart() {
    return new Generator();
  }
}

const generatorPluginModule = new CosmosisPlugin('generator', GeneratorModule);

export {
  GeneratorModule,
  generatorPluginModule,
}
