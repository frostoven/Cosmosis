import CosmosisPlugin from '../../../types/CosmosisPlugin';
import Multimeter from './types/Multimeter';

class MultimeterModule {
  constructor() {
  }

  createPart() {
    return new Multimeter();
  }
}

const multimeterPluginModule = new CosmosisPlugin('multimeterModule', MultimeterModule);

export {
  MultimeterModule,
  multimeterPluginModule,
}
