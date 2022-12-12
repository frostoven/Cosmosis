import { gameRuntime } from '../../../../gameRuntime';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';

export default class CockpitLights {
  private _switchedOn: boolean;
  private _hasPower: boolean;

  constructor() {
    this._switchedOn = false;
    this._hasPower = false;

    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      shipPilot.pulse.cycleCockpitLights.getEveryChange(() => {
        console.log('Cycling cockpit lights');
      });
    });
  }

  step() {}
}
