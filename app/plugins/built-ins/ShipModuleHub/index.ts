import CosmosisPlugin from '../../types/CosmosisPlugin';
import Pluggable from './types/Pluggable';
import { gameRuntime } from '../../gameRuntime';
import ModuleSpawner from '../shipModules/types/ModuleSpawner';
import Delegable from './types/Delegable';
import ShipModule from '../shipModules/types/ShipModule';
import {
  EciRegistrationSignature
} from '../shipModules/types/EciRegistrationSignature';

class ShipModuleHub {
  constructor() {
  }

  plug(device: ShipModule) {
    return new Pluggable(device);
  }

  delegate(device: ShipModule) {
    return new Delegable(device);
  }

  // TODO: Decide on naming here. spawnPart might be more appropriate if we
  //  continue to use this function for unconditional part spawning.
  acquirePart({ name, inventory, eciRegistration }: {
    name: string,
    inventory: {},
    eciRegistration: EciRegistrationSignature,
  }) {
    const deviceSpawner: ModuleSpawner = gameRuntime.tracked[`${name}Module`]?.cachedValue;
    if (!deviceSpawner) {
      console.error(`Part type '${name}' (aka ${name}Module) does not seem to exist in this reality.`);
      return null;
    }
    return deviceSpawner.createPart({ inventory, eciRegistration });
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
};
