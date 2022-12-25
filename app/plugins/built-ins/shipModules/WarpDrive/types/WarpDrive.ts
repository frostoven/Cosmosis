import ShipModule from '../../types/ShipModule';
import { gameRuntime } from '../../../../gameRuntime';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';

export default class WarpDrive extends ShipModule {
  readonly friendlyName: string;
  warpBubbleActive: boolean;
  _powerSource: any;
  private readonly _warpChargeTime: number;
  private _warpCountdown: number;

  constructor() {
    super();
    this.friendlyName = 'warp drive';
    this.powerNeeded = 5;
    this.bootPowerNeeded = 12;

    this.warpBubbleActive = false;

    this._powerSource = null;

    this._warpChargeTime = 7;
    this._warpCountdown = 0;

    this._setupListeners();
  }

  _setupListeners() {
    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      shipPilot.pulse.engageWarpDrive.getEveryChange(this.initiateWarpBubble.bind(this));
    });
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  // Drastically increases power drain to create a warp bubble. Once the warp
  // bubble is active and functional, power requirements drop again.
  initiateWarpBubble() {
    console.log(`-> Initiating warp countdown. ETA: ${this._warpChargeTime} seconds.`);
    this._warpCountdown = this._warpChargeTime;
  }

  // Creates the actual warp bubble that the ship is in.
  _manifestWarpBubble() {
    console.log(`-> Warp bubble has been created.`);
    this.warpBubbleActive = true;
    // TODO: inform propulsion manager of the change.
  }

  step({ delta }) {
    if (!this._powerSource) {
      return;
    }

    // If our count is greater than 0, and it hits zero, initiate warp. Do this
    // regardless of whether or not the player requested it: anything that
    // triggers a countdown, whether intentional or accidental, should trigger
    // eventual warp bubble creation.
    if (this._warpCountdown > 0) {
      if ((this._warpCountdown -= delta) <= 0) {
        this._manifestWarpBubble();
      }
    }
  }
}
