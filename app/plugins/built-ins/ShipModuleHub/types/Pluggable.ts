// Intended use is with the ShipModuleHub hub. Example:
// hub.plug(cockpitLights).intoPowerOutletOf(generator);
import { HubError } from './HubError';

export default class Pluggable {
  private readonly device: any;

  constructor(device) {
    this.device = device;
  }

  intoPowerOutletOf(otherDevice) {
    if (!this.device) {
      console.error('Device not defined correctly.');
      return;
    }

    if (!otherDevice.connectDrain) {
      throw new Error(
        `${otherDevice.friendlyName} does not have a power outlet.`,
        // @ts-ignore - TS says this is expected; MDN says otherwise.
        { cause: HubError.deviceLacksPowerOutlet }
      );
    }

    if (!this.device.connectPowerSource) {
      throw new Error(
        `${this.device.friendlyName} does not have a power inlet.`,
        // @ts-ignore - TS says this is expected; MDN says otherwise.
        { cause: HubError.deviceLacksPowerInlet }
      );
    }

    console.log(`connecting ${this.device.friendlyName}'s power receiver into ${otherDevice.friendlyName}'s drain-out.`);
    otherDevice.connectDrain(this.device);
    this.device.connectPowerSource(otherDevice);
    return otherDevice;
  }
}
