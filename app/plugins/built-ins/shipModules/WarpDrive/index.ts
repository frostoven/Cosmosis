import CosmosisPlugin from '../../../types/CosmosisPlugin';
import WarpDrive from './types/WarpDrive';
import ModuleSpawner from '../types/ModuleSpawner';
import { gameRuntime } from '../../../gameRuntime';
import { ShipPilot } from '../../modes/playerControllers/ShipPilot';
import { warpDriveControls } from './controls';

class WarpDriveModule extends ModuleSpawner {
  constructor() {
    super();
    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      shipPilot.extendControlSchema(warpDriveControls);
    });
  }

  createPart() {
    return new WarpDrive();
  }
}

const warpDriveModulePlugin = new CosmosisPlugin('warpDriveModule', WarpDriveModule);

export {
  WarpDriveModule,
  warpDriveModulePlugin,
}
