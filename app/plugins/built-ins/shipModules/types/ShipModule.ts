/**
 * ### Power use
 * Note that operational power (i.e. a laser being fired or a warp drive
 * preparing a warp bubble) is not defined by this class. It only defines power
 * used at boot, and power used during standby. This is because peak power use
 * could simply be the normal power rating (such as a 60W light) or could have
 * variable requirements (such a computer, which can spin up drives or suddenly
 * start firing the GPU). Operational power should thus be defined by the child
 * classes, and not here.
 */

export default class ShipModule {
  friendlyName: string;
  // Stand-by power - in other words, the device is on, but not doing anything
  // interesting.
  powerNeeded: number;
  // Power spike created when device is booted or rebooted.
  bootPowerNeeded: number;

  constructor() {
    this.friendlyName = 'unnamed module';

    this.powerNeeded = -Infinity;
    this.bootPowerNeeded = -Infinity;
  }

  step(options) {
    //
  }

  connectPowerIn() {
    //
  }

  disconnectPowerIn() {
    //
  }

  connectPowerOut() {
    //
  }

  disconnectPowerOut() {
    //
  }

  connectDataIn() {
    //
  }

  disconnectDataIn() {
    //
  }

  connectDataOut() {
    //
  }

  disconnectDataOut() {
    //
  }
}
