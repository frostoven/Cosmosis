import ShipModule from '../../types/ShipModule';

export default class Multimeter extends ShipModule {
  readonly friendlyName: string;
  _powerSource: any;

  constructor() {
    super();
    this.friendlyName = 'multimeter';
    this.powerNeeded = 5;
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
  }
}
