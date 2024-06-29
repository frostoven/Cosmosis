import CosmosisPlugin from '../../../types/CosmosisPlugin';
import ModuleSpawner from '../types/ModuleSpawner';
import ElectricalHousing from './types/ElectricalHousing';
import { logBootInfo } from '../../../../local/windowLoadListener';

class ElectricalHousingModule extends ModuleSpawner {
  createPart() {
    logBootInfo('Electrical grid self-test: Nominal');
    return new ElectricalHousing();
  }
}

const electricalHousingModulePlugin =
  new CosmosisPlugin('electricalHousingModule', ElectricalHousingModule);

export {
  ElectricalHousingModule,
  electricalHousingModulePlugin,
};
