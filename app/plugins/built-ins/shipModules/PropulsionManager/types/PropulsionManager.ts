import ShipModule from '../../types/ShipModule';

export default class PropulsionManager extends ShipModule {
  readonly friendlyName: string;
  _powerSource: any;

  constructor() {
    super();
    this.friendlyName = 'propulsionManager';
    this.powerNeeded = 1;
    this.bootPowerNeeded = 1;

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
