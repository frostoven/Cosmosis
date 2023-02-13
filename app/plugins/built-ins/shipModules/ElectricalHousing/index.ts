import CosmosisPlugin from '../../../types/CosmosisPlugin';
import ModuleSpawner from '../types/ModuleSpawner';
import ElectricalHousing from './types/ElectricalHousing';

class ElectricalHousingModule extends ModuleSpawner {
  createPart() {
    return new ElectricalHousing();
  }
}

const electricalHousingModulePlugin =
  new CosmosisPlugin('electricalHousingModule', ElectricalHousingModule);

export {
  ElectricalHousingModule,
  electricalHousingModulePlugin,
}
