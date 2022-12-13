import { gameRuntime } from '../../../../gameRuntime';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';
import { NodeOps } from '../../../NodeOps';
import ShipModule from '../../types/ShipModule';

export default class CockpitLights extends ShipModule {
  private readonly _inventory: any;
  private _switchedOn: boolean;
  private _hasPower: boolean;
  // The percentage of energy we're receiving vs what we actually need.
  private _ratioMet: number;
  // Allows the user to adjust variable light knob.
  // private readonly _userAdjustedRatio: number;
  private _powerSource: any;

  constructor({ inventory }) {
    super();
    this.friendlyName = 'cockpit light circuit';
    this._inventory = inventory.cockpitLights;
    this._switchedOn = false;
    this._hasPower = false;

    this._ratioMet = 0;
    // this._userAdjustedRatio = 1;

    this.powerNeeded = 10;
    this.bootPowerNeeded = 12;
    // this._powerAdjusted = this.powerNeeded * this._userAdjustedRatio;

    console.log('--> CockpitLights received inventory:', this._inventory);

    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      shipPilot.pulse.cycleCockpitLights.getEveryChange(this._handleUserEvent.bind(this));
    });
  }

  _handleUserEvent() {
    // Note: this does not guarantee we'll have light. Both this and _hasPower
    // needs to be true for lights to shine.
    this._switchedOn = !this._switchedOn;
    this._changeSwitchState();
  }

  _changeSwitchState() {
    // console.log(`==> _changeSwitchState: Number(${this._switchedOn && this._hasPower}) * ${this._ratioMet}`);
    console.log(`==> _changeSwitchState: Number(${this._switchedOn} && ${this._hasPower}) * ${this._ratioMet}`);

    gameRuntime.tracked.nodeOps.getOnce((nodeOps: NodeOps) => {
      const inventory = this._inventory;
      for (let i = 0, len = inventory.length; i < len; i++) {
        const { node, userData } = inventory[i];
        nodeOps.switchLights(
          node,
          userData,
          Number(this._switchedOn && this._hasPower) * this._ratioMet,
          );
      }
    });
  }

  setPowerAndInvalidate(value) {
    if (this._hasPower !== value) {
      this._hasPower = value;
      this._changeSwitchState();
    }
  }

  setRatioAndInvalidate(value) {
    if (this._ratioMet !== value) {


      const energy = this._powerSource.drain(this.powerNeeded);
      const energyRatio = this._powerSource.getDrainAsRatio(this.powerNeeded);
      console.log('==>', {energy, energyRatio});

      this._ratioMet = value;
      this._changeSwitchState();
    }
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  step() {
    if (!this._powerSource) {
      if (this._hasPower) {
        this.setPowerAndInvalidate(false);
      }
      return;
    }
    else {
      this.setPowerAndInvalidate(true);
    }

    const energyRatio = this._powerSource.getDrainAsRatio(this.powerNeeded);
    this.setRatioAndInvalidate(energyRatio);
  }
}
