import { gameRuntime } from '../../../../gameRuntime';
import { HelmControl } from '../../../modes/playerControllers/HelmControl';
import { SpacetimeControl } from '../../../SpacetimeControl';
import { CoordType } from '../../../SpacetimeControl/types/CoordType';
import PropulsionManager
  from '../../PropulsionManager/types/PropulsionManager';
import { PropulsionManagerModule } from '../../PropulsionManager';
import WarpEngineMechanism from './WarpEngineMechanism';
import PropulsionModule from '../../types/PropulsionModule';
import { PropulsionTypeEnum } from '../../types/PropulsionTypeEnum';
import { ModuleUpdateMode } from '../../types/ModuleUpdateMode';
import Core from '../../../Core';

const animationData = Core.animationData;

export default class WarpDrive extends PropulsionModule {
  readonly friendlyName: string;
  warpBubbleActive: boolean;
  _powerSource: any;
  // This determines whether or
  private _controlInterfaceActive: boolean;
  private readonly _warpChargeTime: number;
  private _warpCountdown: number;
  private _cachedPropulsionManager: PropulsionManagerModule;
  private _cachedSpacetime: SpacetimeControl;
  private _parentPropulsionManger: PropulsionManager | undefined;
  private _warpEngine: WarpEngineMechanism;

  constructor() {
    super();
    this.type = PropulsionTypeEnum.warp;
    this.friendlyName = 'warp drive';
    this.powerNeeded = 5;
    this.bootPowerNeeded = 12;
    this.updateMode = ModuleUpdateMode.active;

    this.warpBubbleActive = false;

    this._powerSource = null;

    this._controlInterfaceActive = false;
    this._warpChargeTime = 1; // 7;
    this._warpCountdown = -1;
    this._warpEngine = new WarpEngineMechanism();

    this._cachedPropulsionManager = gameRuntime.tracked.propulsionManagerModule.cachedValue;
    this._cachedSpacetime = gameRuntime.tracked.spacetimeControl.cachedValue;
    this._setupListeners();
  }

  _setupListeners() {
    gameRuntime.tracked.helmControl.getOnce((helmControl: HelmControl) => {
      // Bind controls.
      helmControl.pulse.engageWarpDrive.getEveryChange(this.imposeSelfActivationToggle.bind(this));
    });
    gameRuntime.tracked.propulsionManagerModule.getEveryChange((manager: PropulsionManagerModule) => {
      this._cachedPropulsionManager = manager;
    });
    gameRuntime.tracked.spacetimeControl.getEveryChange((location) => {
      this._cachedSpacetime = location;
    });
  }

  // Attempts to force the propulsion manger to activate this module.
  imposeSelfActivationToggle() {
    if (!this._parentPropulsionManger) {
      console.log('[Warp drive] Propulsion management system not connected.');
      return;
    }

    if (this._controlInterfaceActive) {
      // First, stop any active countdowns:
      this._warpCountdown = -1;
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
    this._parentPropulsionManger = device;
  }

  // Drastically increases power drain to create a warp bubble. Once the warp
  // bubble is active and functional, power requirements drop again.
  initiateWarpBubble() {
    console.log(`-> Initiating warp countdown. ETA: ${this._warpChargeTime} seconds.`);
    this._warpEngine.reset();
    this._warpCountdown = this._warpChargeTime;
  }

  // Creates the actual warp bubble that the ship is in.
  _manifestWarpBubble() {
    // This part is very important: playerCentric means that we don't move the
    // ship, but rather move the universe.
    this._cachedSpacetime.coordMode = CoordType.playerCentric;
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

  setThrottle(throttle: number) {
    this._warpEngine.currentThrottle = throttle * 100;
  }

  step() {
    if (!this._powerSource || !this._controlInterfaceActive) {
      return;
    }

    const { delta } = animationData;

    // If our count is greater than 0, and it hits zero, initiate warp. Do this
    // regardless of whether or not the player requested it: anything that
    // triggers a countdown, whether intentional or accidental, should trigger
    // eventual warp bubble creation.
    if (this._warpCountdown > 0) {
      if ((this._warpCountdown -= delta) <= 0) {
        this._manifestWarpBubble();
      }
    }

    if (this.warpBubbleActive) {
      this._warpEngine.stepWarp(this._cachedSpacetime);
    }
  }
}
