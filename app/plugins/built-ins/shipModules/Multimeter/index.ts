import CosmosisPlugin from '../../../types/CosmosisPlugin';
import Multimeter from './types/Multimeter';
import ModuleSpawner from '../types/ModuleSpawner';

class MultimeterModule extends ModuleSpawner {
  createPart() {
    return new Multimeter();
  }
}

const multimeterModulePlugin = new CosmosisPlugin('multimeterModule', MultimeterModule);

export {
  MultimeterModule,
  multimeterModulePlugin,
}
