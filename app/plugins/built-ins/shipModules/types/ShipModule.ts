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
import { ModuleUpdateMode } from './ModuleUpdateMode';

export default class ShipModule {
  friendlyName: string;
  // Stand-by power - in other words, the device is on, but not doing anything
  // interesting.
  powerNeeded: number;
  // Power spike created when device is booted or rebooted.
  bootPowerNeeded: number;
  // Determines whether the module waits for updates and scans for updates.
  updateMode: ModuleUpdateMode = ModuleUpdateMode.passive;

  constructor() {
    this.friendlyName = 'unnamed module';

    this.powerNeeded = -Infinity;
    this.bootPowerNeeded = -Infinity;
  }

  step() {
    //
  }

  connectPowerIn() {
    console.error(
      `[connectPowerIn] '${this.friendlyName}': interface no supported.`,
    );
  }

  disconnectPowerIn() {
    console.error(
      `[disconnectPowerIn] '${this.friendlyName}': interface no supported.`,
    );
  }

  connectPowerOut() {
    console.error(
      `[connectPowerOut] '${this.friendlyName}': interface no supported.`,
    );
  }

  disconnectPowerOut() {
    console.error(
      `[disconnectPowerOut] '${this.friendlyName}': interface no supported.`,
    );
  }

  connectDataIn() {
    console.error(
      `[connectDataIn] '${this.friendlyName}': interface no supported.`,
    );
  }

  disconnectDataIn() {
    console.error(
      `[disconnectDataIn] '${this.friendlyName}': interface no supported.`,
    );
  }

  connectDataOut() {
    console.error(
      `[connectDataOut] '${this.friendlyName}': interface no supported.`,
    );
  }

  disconnectDataOut() {
    console.error(
      `[disconnectDataOut] '${this.friendlyName}': interface no supported.`,
    );
  }

  activateControlInterface() {
    console.error(
      `[activateControlInterface] '${this.friendlyName}': interface no supported.`,
    );
  }

  deactivateControlInterface() {
    console.error(
      `[deactivateControlInterface] '${this.friendlyName}': interface no supported.`,
    );
  }
}
