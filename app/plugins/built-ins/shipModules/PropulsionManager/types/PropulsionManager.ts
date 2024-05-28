import ShipModule from '../../types/ShipModule';
import { PropulsionManagerECI } from './PropulsionManagerECI';
import PropulsionModule from '../../types/PropulsionModule';
import { EciEnum } from '../../types/EciEnum';
import { PropulsionTypeEnum } from '../../types/PropulsionTypeEnum';
import Core from '../../../Core';

const nop = () => {
};

const propulsionView = Core.unifiedView.propulsion;

// Dev note: Once an engine is plugged in, it cannot be plugged out without
// shutting down the system. Damage should be handled without things being
// unplugged.
export default class PropulsionManager extends ShipModule {
  readonly friendlyName: string;
  _powerSource: any;
  private _activePropulsionInterface: PropulsionModule | null;
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
        canReverse: false,
        cycleEngineType: false,
        impulse: false,
        warp: false,
        hyper: false,
        cascade: false,
        modalShift: false,
      },
      activeFlags: {
        canReverse: false,
      },
      cli: {
        cycleEngineType: this.cyclePropulsionDevice,
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
        capabilities.canReverse = true;
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

  getPropulsionDevice(deviceOrIndex: PropulsionModule | number) {
    let device: PropulsionModule;
    if (typeof deviceOrIndex === 'number') {
      if (deviceOrIndex === -1) {
        return null;
      }
      device = this._propulsionInterfaces[deviceOrIndex] || null;
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

    // Currently, only impulse drives can reverse.
    this._eciSpec.activeFlags.canReverse = propulsionView.canReverse =
      device.type === PropulsionTypeEnum.impulse;
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

  cyclePropulsionDevice = () => {
    if (this._propulsionInterfaces.length === 0) {
      return false;
    }

    if (this._activePropulsionInterface === null) {
      this.activatePropulsionSystem(this._propulsionInterfaces[0]);
      return true;
    }

    let index = this._propulsionInterfaces.indexOf(this._activePropulsionInterface);
    if (index === -1) {
      console.error(
        '[cyclePropulsionDevice] Bug detected: Propulsion device is not plugged in.',
      );
      return;
    }

    index++;
    if (index + 1 > this._propulsionInterfaces.length) {
      index = 0;
    }
    this.activatePropulsionSystem(index);
  };

  step() {
    if (!this._powerSource || !this._activePropulsionInterface) {
      return;
    }

    const engine: PropulsionModule = this._activePropulsionInterface;
    engine.setThrottle(Core.unifiedView.helm.throttlePosition);

    // if (this._activePropulsionInterface !== null) {
    //   // pass steer commands to this._activePropulsionInterface
    //   // this._activePropulsionInterface.
    // }
  }
}
