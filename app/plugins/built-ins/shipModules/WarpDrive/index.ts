import CosmosisPlugin from '../../../types/CosmosisPlugin';
import WarpDrive from './types/WarpDrive';
import ModuleSpawner from '../types/ModuleSpawner';
import { gameRuntime } from '../../../gameRuntime';
import { HelmControl } from '../../modes/playerControllers/HelmControl';
import { warpDriveControls } from './controls';

class WarpDriveModule extends ModuleSpawner {
  constructor() {
    super();

    gameRuntime.tracked.helmControl.getOnce((helmControl: HelmControl) => {
      helmControl.extendControlSchema(warpDriveControls);
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
