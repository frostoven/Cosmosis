import ShipModule from '../../types/ShipModule';
import { PropulsionManagerECI } from './PropulsionManagerECI';
import PropulsionModule from '../../types/PropulsionModule';
import { EciEnum } from '../../types/EciEnum';
import { PropulsionTypeEnum } from '../../types/PropulsionTypeEnum';

const nop = () => {
};

export default class PropulsionManager extends ShipModule {
  readonly friendlyName: string;
  _powerSource: any;
  private _activePropulsionInterface: any;
  private readonly _propulsionInterfaces: Array<any>;
  private readonly _eciSpec: PropulsionManagerECI;

  constructor({ eciRegistration }: { eciRegistration: Function }) {
    super();
    this.friendlyName = 'propulsionManager';
    this.powerNeeded = 1;
    this.bootPowerNeeded = 1;

    this._powerSource = null;
    this._propulsionInterfaces = [];
    this._activePropulsionInterface = null;

    // The spec is updated as new devices are connected to it.
    this._eciSpec = {
      capabilities: {
        setThrust: false,
        cycleEngineType: false,
        impulse: false,
        warp: false,
        hyper: false,
        cascade: false,
        modalShift: false,
      },
      cli: {
        setThrottle: nop,
        cycleEngineType: nop,
        activateSpecificEngineType: nop,
      },
      manufacturerInfo: {
        manufacturer: 'not specified',
        model: 'not specified',
        tamperCheck: 'pass',
      },
    };
    eciRegistration({ key: EciEnum.propulsion, getEci: () => this._eciSpec });
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  registerPropulsionInterface(device: PropulsionModule) {
    this._propulsionInterfaces.push(device);
    const capabilities = this._eciSpec.capabilities;

    switch (device.type) {
      case PropulsionTypeEnum.impulse:
        capabilities.impulse = true;
        capabilities.setThrust = true;
        break;
      case PropulsionTypeEnum.warp:
        capabilities.warp = true;
        capabilities.setThrust = true;
        break;
      case PropulsionTypeEnum.hyper:
        capabilities.hyper = true;
        break;
      case PropulsionTypeEnum.cascade:
        capabilities.cascade = true;
        break;
      case PropulsionTypeEnum.modalShift:
        capabilities.modalShift = true;
        break;
    }

    if (this._propulsionInterfaces.length > 1) {
      capabilities.cycleEngineType = true;
    }

    // if (this._activePropulsionInterface === null) {
    //   this.activatePropulsionSystem(device);
    // }
  }

  getPropulsionDevice(deviceOrIndex: ShipModule | number) {
    let device: ShipModule;
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
  activatePropulsionSystem(deviceOrIndex: number | PropulsionModule) {
    const device = this.getPropulsionDevice(deviceOrIndex);
    this._activePropulsionInterface = device;
    if (device === null) {
      console.warn('[PropulsionManager] Propulsion device state lost.');
      return;
    }

    device.activateControlInterface();
  }

  // Tells the target device to stop responding to controls.
  deactivatePropulsionSystem(deviceOrIndex: number | PropulsionModule) {
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
