import { gameRuntime } from '../../../../gameRuntime';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';
import CockpitLights from '../../CockpitLights/types/CockpitLights';

export default class ExternalLights extends CockpitLights {
  constructor({ inventory }) {
    super({ inventory });
    this.friendlyName = 'external lights circuit';
    this._inventory = inventory.externalLights;

    this.powerNeeded = 10;
    this.bootPowerNeeded = 12;
  }

  _setupListeners() {
    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      shipPilot.pulse.cycleExternalLights.getEveryChange(this._handleUserEvent.bind(this));
    });
  }
}
