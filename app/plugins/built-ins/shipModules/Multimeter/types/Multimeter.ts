import ShipModule from '../../types/ShipModule';

export default class Multimeter extends ShipModule {
  readonly friendlyName: string;
  powerNeeded: number;
  _powerSource: any;

  private bootPowerNeeded: number;

  constructor() {
    super();
    this.friendlyName = 'multimeter';
    this.powerNeeded = 10;
    this.bootPowerNeeded = 12;

    this._powerSource = null;
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  step() {
    if (!this._powerSource) {
      return;
    }

    const energy = this._powerSource.drain(this.powerNeeded);
  }
}
