import CosmosisPlugin from '../../../types/CosmosisPlugin';
import ModuleSpawner from '../types/ModuleSpawner';

class ShipComputerModule extends ModuleSpawner {
  constructor() {
    super();
    throw 'Under construction';
  }

  createPart() {
    throw 'Under construction';
  }
}

const shipComputerModulePlugin = new CosmosisPlugin('shipComputerModule', ShipComputerModule);

export {
  ShipComputerModule,
  shipComputerModulePlugin,
}
