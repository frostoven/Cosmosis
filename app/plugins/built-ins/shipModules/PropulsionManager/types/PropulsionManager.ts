import ShipModule from '../../types/ShipModule';

export default class PropulsionManager extends ShipModule {
  readonly friendlyName: string;
  _powerSource: any;
  private _activePropulsionInterface: any;
  private _propulsionInterfaces: Array<any>;

  constructor() {
    super();
    this.friendlyName = 'propulsionManager';
    this.powerNeeded = 1;
    this.bootPowerNeeded = 1;

    this._powerSource = null;
    this._propulsionInterfaces = [];
    this._activePropulsionInterface = null;
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  registerPropulsionInterface(device) {
    this._propulsionInterfaces.push(device);
    // if (this._activePropulsionInterface === null) {
    //   this.activatePropulsionSystem(device);
    // }
  }

  getPropulsionDevice(deviceOrIndex) {
    let device;
    if (typeof deviceOrIndex === 'number') {
      if (deviceOrIndex === -1) {
        return null;
      }
      device = this._propulsionInterfaces[deviceOrIndex];
    }
    else {
      if (!this._propulsionInterfaces.includes(deviceOrIndex)) {
        console.warn('[PropulsionManager] Invalid device lookup requested (device not registered).');
        return null;
      }
      device = deviceOrIndex;
    }

    return device;
  }

  // Tells the target device to start responding to controls.
  activatePropulsionSystem(deviceOrIndex) {
    const device = this.getPropulsionDevice(deviceOrIndex);
    this._activePropulsionInterface = device;
    if (device === null) {
      console.warn('[PropulsionManager] Propulsion device state lost.');
      return;
    }

    device.activateControlInterface();
  }

  // Tells the target device to stop responding to controls.
  deactivatePropulsionSystem(deviceOrIndex) {
    const device = this.getPropulsionDevice(deviceOrIndex);
    this._activePropulsionInterface = device;
    if (device === null) {
      console.warn('[PropulsionManager] Propulsion device state lost.');
      return;
    }

    device.deactivateControlInterface();
  }

  step() {
    if (!this._powerSource) {
      return;
    }

    // if (this._activePropulsionInterface !== null) {
    //   // pass steer commands to this._activePropulsionInterface
    //   // this._activePropulsionInterface.
    // }
  }
}
