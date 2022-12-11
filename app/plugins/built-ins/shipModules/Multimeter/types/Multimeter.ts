import ShipModule from '../../types/ShipModule';

export default class Multimeter extends ShipModule {
  public readonly friendlyName: string;
  public powerNeeded: number;
  private bootPowerNeeded: number;

  constructor() {
    super();
    this.friendlyName = 'multimeter';
    this.powerNeeded = 10;
    this.bootPowerNeeded = 12;
  }
}
