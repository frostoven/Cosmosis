import ShipModule from '../../types/ShipModule';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import HudItem from '../../../ui/Hud3D/types/HudItem';
import { HudAlign } from '../../../ui/Hud3D/types/HudAlign';
import HudPage from '../../../ui/Hud3D/types/HudPage';
import { gameRuntime } from '../../../../gameRuntime';
import { Hud3D } from '../../../ui/Hud3D';
import Core from '../../../Core';
import ChangeTracker from 'change-tracker/src';

export default class VisorHud extends ShipModule {
  readonly friendlyName: string;
  _powerSource: any;

  private _pluginCache: PluginCacheTracker;
  // @ts-ignore - item will be set before use.
  private _throttle: HudItem;
  private _speedIndicator!: HudItem;
  private _uiLoaded: boolean;

  constructor() {
    super();
    this.friendlyName = 'visor comms interface';
    this.powerNeeded = 0.1;
    this.bootPowerNeeded = 0.2;

    this._uiLoaded = false;
    this._powerSource = null;

    this._pluginCache = new PluginCacheTracker(
      [ 'player' ],
      { player: { camera: 'camera' } },
    );

    this._pluginCache.onAllPluginsLoaded.getOnce(() => {
      this._setupUi();
    });
  }

  _setupUi() {
    this._throttle = new HudItem({
      model: 'throttleStandard',
      align: HudAlign.right,
      offsetY: 0.001,
      xRotation: 0.01,
      scale: 1.1,
      flipOnNegativeProgress: true,
    });

    this._speedIndicator = new HudItem({
      text: 'TBA',
      align: HudAlign.bottomRight,
      offsetY: 0.001,
      xRotation: 0.01,
    });

    const page = new HudPage('visorHud', [ this._throttle, this._speedIndicator ]);
    gameRuntime.tracked.hud3D.getOnce((hud3d: Hud3D) => {
      hud3d.setScreenPage(page, this._pluginCache.camera);

      ChangeTracker.waitForAll([
        this._throttle.onMeshLoaded,
        this._speedIndicator.onMeshLoaded,
      ]).getOnce(() => {
        this._uiLoaded = true;
        // this._throttle._debugDetachFromFace();
        // this._speedIndicator._debugDetachFromFace();
      });
    });
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  step({ delta }) {
    if (!this._powerSource || !this._uiLoaded) {
      return;
    }

    // TODO: on power dim, consider implementing this, it's very satisfying:
    // this.throttle.setProgress(Math.random(), true);

    this._throttle.setProgress(Core.unifiedView.helm.throttlePrettyPosition);
  }
}
