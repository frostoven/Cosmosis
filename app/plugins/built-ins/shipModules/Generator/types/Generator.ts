export default class Generator {
  readonly friendlyName: string;
  readonly powerNeeded: number;
  maxOutput: number;

  private readonly _allConnectedDrains: any[];
  // This number is always 0-1 (i.e. it's a percentage). If 1, all devices
  // can get the power they're asking for. Else, every device will have their
  // requested power amount multiplied by this number.
  private _outputRatio: number;
  // Cached value so that we don't need to calculate it on request.
  private _effectiveOutput: number;
  // Cached state values so that we don't need to calculate it on request.
  private readonly _supplyStateCache: {
    have: number, demand: number, effectiveOutput: number, outputRatio: number,
  };
  private _poweredOn: boolean;

  constructor() {
    this.friendlyName = 'generator';
    // Note: this is the power this unit needs to receive for it to function.
    // It obviously won't need any, as it generates energy.
    this.powerNeeded = 0;
    this._poweredOn = false;

    this.maxOutput = 15; // 124;

    this._allConnectedDrains = [];
    this._outputRatio = 1;
    this._effectiveOutput = 0;

    this._supplyStateCache = {
      have: 0, demand: 0, effectiveOutput: 0, outputRatio: 1,
    };
  }

  powerOn() {
    this._poweredOn = true;
  }

  powerOff() {
    this._poweredOn = false;
  }

  drain(amount) {
    if (!this._poweredOn) {
      return 0;
    }

    if (this._outputRatio === 1) {
      return amount;
    }
    else {
      if (amount > this.maxOutput) {
        amount = this.maxOutput;
      }
      return amount * this._outputRatio;
    }
  }

  getDrainAsRatio(amount) {
    if (!this._poweredOn) {
      return 0;
    }

    if (this._outputRatio === 1) {
      return 1;
    }
    else {
      if (amount > this.maxOutput) {
        return this.maxOutput / amount;
      }
      return this._outputRatio;
    }
  }

  connectDrain(device) {
    this._allConnectedDrains.push(device);

    let totalPowerNeeded = 0;
    for (let i = 0, len = this._allConnectedDrains.length; i < len; i++) {
      const drain = this._allConnectedDrains[i];
      if (drain.powerNeeded > this.maxOutput) {
        // We cannot drain more than max, so if over max, cap to max.
        totalPowerNeeded += this.maxOutput;
      }
      else {
        totalPowerNeeded += drain.powerNeeded;
      }
    }

    if (totalPowerNeeded < this.maxOutput) {
      this._outputRatio = 1;
    }
    else {
      this._outputRatio = this.maxOutput / totalPowerNeeded;
    }

    this._effectiveOutput =
      totalPowerNeeded < this.maxOutput ?
        Infinity :
        this.maxOutput * this._outputRatio;

    this._supplyStateCache.have = this.maxOutput;
    this._supplyStateCache.demand = totalPowerNeeded;
    this._supplyStateCache.outputRatio = this._outputRatio;
    this._supplyStateCache.effectiveOutput = this._effectiveOutput;

    // We're able to catch things this way because the ShipModule base class
    // defaults are set to -Infinity.
    if (this._supplyStateCache.demand === -Infinity) {
      throw 'A module was connected with power requirements left undefined. Please correct this.';
    }

    console.log('Device connected. Supply state:', this.getSupplyState());
  }

  getSupplyState() {
    return this._supplyStateCache;
  }

  step() {
    // TODO: handle damage and load changes here.
  }
}
