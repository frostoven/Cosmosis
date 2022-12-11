import CosmosisPlugin from '../../types/CosmosisPlugin';
import Pluggable from './types/Pluggable';
import Multimeter from '../shipModules/Multimeter/types/Multimeter';
import Generator from '../shipModules/Generator/types/Generator';

class ShipModuleHub {
  constructor() {
  }

  plug(device) {
    return new Pluggable(device);
  }
}

// Example code:
// console.log('---------------------------------------------------------------------');
//
// const shipModuleHub = new ShipModuleHub();
//
// const generator = new Generator();
// const multimeter1 = new Multimeter();
// const multimeter2 = new Multimeter();
// //
// generator.maxOutput = 20;
// multimeter1.powerNeeded = 10;
// multimeter2.powerNeeded = 200;
// // multimeter2.powerNeeded = 40;
// //
// shipModuleHub.plug(multimeter1).intoPowerOutletOf(generator);
// shipModuleHub.plug(multimeter2).intoPowerOutletOf(generator);
//
// console.log('---------------------------------------------------------------------');

const shipModuleHubPlugin = new CosmosisPlugin('shipModuleHub', ShipModuleHub);

export {
  ShipModuleHub,
  shipModuleHubPlugin,
}
