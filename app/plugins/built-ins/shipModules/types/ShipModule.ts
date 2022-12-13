export default class ShipModule {
  friendlyName: string;
  powerNeeded: number;
  bootPowerNeeded: number;

  constructor() {
    this.friendlyName = 'unnamed module';

    this.powerNeeded = -Infinity;
    this.bootPowerNeeded = -Infinity;
  }

  step() {
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
}
