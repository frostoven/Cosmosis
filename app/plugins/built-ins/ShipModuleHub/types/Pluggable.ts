export default class Pluggable {
  private readonly device: any;

  constructor(device) {
    this.device = device;
  }

  intoPowerOutletOf(otherDevice) {
    console.log(`connecting ${this.device.friendlyName}'s power receiver into ${otherDevice.friendlyName}'s drain-out.`);
    otherDevice.connectDrain(this.device);
    this.device.connectPowerSource(otherDevice);
    return otherDevice;
  }
}
