// Intended use is with the ShipModuleHub hub. Example:
// hub.delegate(warpDrive).controlMechanismsTo(propulsionManager);
import { HubError } from './HubError';

export default class Delegable {
  private readonly device: any;

  constructor(device) {
    this.device = device;
  }

  controlMechanismsTo(otherDevice) {
    if (!otherDevice.registerPropulsionInterface) {
      throw new Error(
        `${otherDevice.friendlyName} does not have an outbound propulsion control port.`,
        // @ts-ignore - TS says this is expected; MDN says otherwise.
        { cause: HubError.deviceLacksPropulsionTxInterface }
      );
    }

    if (!this.device.registerPropulsionManager || !this.device.activateControlInterface) {
      throw new Error(
        `${this.device.friendlyName} does not have appropriate control receivers.`,
        // @ts-ignore - TS says this is expected; MDN says otherwise.
        { cause: HubError.deviceLacksPropulsionRxInterface }
      );
    }

    console.log(`delegating control of ${this.device.friendlyName} to ${otherDevice.friendlyName}.`);
    otherDevice.registerPropulsionInterface(this.device);
    this.device.registerPropulsionManager(otherDevice);
    return otherDevice;
  }
}
