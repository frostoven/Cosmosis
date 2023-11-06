import CosmosisPlugin from '../../../types/CosmosisPlugin';
import ModuleSpawner from '../types/ModuleSpawner';
import ExternalLights from './types/ExternalLights';
import { gameRuntime } from '../../../gameRuntime';
import { ShipPilot } from '../../modes/playerControllers/ShipPilot';
import { externalLightControls } from './controls';
import { InputManager } from '../../InputManager';

class ExternalLightsModule extends ModuleSpawner {
  constructor() {
    super();

    InputManager.allControlSchemes.externalLightControls = {
      key: 'externalLightControls',
      schema: externalLightControls,
      mergeInto: 'shipPilotControls',
      friendly: '[merged into shipPilotControls]',
    };

    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      shipPilot.extendControlSchema(externalLightControls);
    });
  }

  createPart({ inventory }) {
    return new ExternalLights({ inventory });
  }
}

const externalLightsModulePlugin = new CosmosisPlugin('externalLightsModule', ExternalLightsModule);

export {
  ExternalLightsModule,
  externalLightsModulePlugin,
}
