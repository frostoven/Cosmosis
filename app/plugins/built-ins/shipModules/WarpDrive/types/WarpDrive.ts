import ShipModule from '../../types/ShipModule';
import { gameRuntime } from '../../../../gameRuntime';
import { ShipPilot } from '../../../modes/playerControllers/ShipPilot';
import { Location } from '../../../Location';
import { CoordType } from '../../../Location/types/CoordType';
import PropulsionManager from '../../PropulsionManager/types/PropulsionManager';
import { PropulsionManagerModule } from '../../PropulsionManager';

export default class WarpDrive extends ShipModule {
  readonly friendlyName: string;
  warpBubbleActive: boolean;
  _powerSource: any;
  // This determines whether or
  private _controlInterfaceActive: boolean;
  private readonly _warpChargeTime: number;
  private _warpCountdown: number;
  private _cachedPropulsionManager: PropulsionManagerModule;
  private _cachedLocation: Location;
  private _parentPropulsionManger: PropulsionManager | undefined;

  constructor() {
    super();
    this.friendlyName = 'warp drive';
    this.powerNeeded = 5;
    this.bootPowerNeeded = 12;

    this.warpBubbleActive = false;

    this._powerSource = null;

    this._controlInterfaceActive = false;
    this._warpChargeTime = 7;
    this._warpCountdown = 0;

    this._cachedPropulsionManager = gameRuntime.tracked.propulsionManagerModule.cachedValue;
    this._cachedLocation = gameRuntime.tracked.location.cachedValue;
    this._setupListeners();
  }

  _setupListeners() {
    gameRuntime.tracked.shipPilot.getOnce((shipPilot: ShipPilot) => {
      // Bind controls.
      shipPilot.pulse.engageWarpDrive.getEveryChange(this.imposeSelfActivationToggle.bind(this));
    });
    gameRuntime.tracked.propulsionManagerModule.getEveryChange((manager: PropulsionManagerModule) => {
      this._cachedPropulsionManager = manager;
    });
    gameRuntime.tracked.location.getEveryChange((location) => {
      this._cachedLocation = location;
    });
  }

  // Attempts to force the propulsion manger to activate this module.
  imposeSelfActivationToggle() {
    if (!this._parentPropulsionManger) {
      console.log('[Warp drive] Propulsion management system not connected.');
      return;
    }

    if (this._controlInterfaceActive) {
      console.log('[Warp drive] Sending deactivation request to propulsion management system.');
      this._parentPropulsionManger.deactivatePropulsionSystem(this);
    }
    else {
      console.log('[Warp drive] Sending activation request to propulsion management system.');
      this._parentPropulsionManger.activatePropulsionSystem(this);
    }
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  registerPropulsionManager(device) {
    console.log('-----> [Warp drive] registering parent:', device);
    this._parentPropulsionManger = device;
  }

  // Drastically increases power drain to create a warp bubble. Once the warp
  // bubble is active and functional, power requirements drop again.
  initiateWarpBubble() {
    console.log(`-> Initiating warp countdown. ETA: ${this._warpChargeTime} seconds.`);
    this._warpCountdown = this._warpChargeTime;
  }

  // Creates the actual warp bubble that the ship is in.
  _manifestWarpBubble() {
    // This part is very important: playerCentric means that we don't move the
    // ship, but rather move the universe.
    this._cachedLocation.coordMode = CoordType.playerCentric;
    this.warpBubbleActive = true;
    console.log(`-> Warp bubble has been created.`);
    // TODO: inform propulsion manager of the change.
  }

  activateControlInterface() {
    console.log('--> Warp drive now listening for commands.');
    this._controlInterfaceActive = true;
    this.initiateWarpBubble();
  }

  deactivateControlInterface() {
    console.log('--> Warp drive no longer listening for commands.');
    this._controlInterfaceActive = false;
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

    // if (this._controlInterfaceActive) {
    //   //
    // }
  }
}
