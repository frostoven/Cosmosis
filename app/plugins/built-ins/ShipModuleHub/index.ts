import CosmosisPlugin from '../../types/CosmosisPlugin';
import Pluggable from './types/Pluggable';
import { gameRuntime } from '../../gameRuntime';
import ModuleSpawner from '../shipModules/types/ModuleSpawner';

class ShipModuleHub {
  constructor() {
  }

  plug(device) {
    return new Pluggable(device);
  }

  // TODO: Decide on naming here. spawnPart might be more appropriate if we
  //  continue to use this function for unconditional part spawning.
  acquirePart(partName: string) {
    const deviceSpawner: ModuleSpawner = gameRuntime.tracked[`${partName}Module`]?.cachedValue;
    if (!deviceSpawner) {
      throw `Part type '${partName}' (aka ${partName}Module) does not seem to exist in this reality.`;
    }
    return deviceSpawner.createPart();
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
