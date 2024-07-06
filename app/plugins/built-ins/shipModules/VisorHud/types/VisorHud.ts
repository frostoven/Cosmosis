import ShipModule from '../../types/ShipModule';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import HudItem from '../../../ui/Hud3D/types/HudItem';
import { HudAlign } from '../../../ui/Hud3D/types/HudAlign';
import HudPage from '../../../ui/Hud3D/types/HudPage';
import { Hud3D } from '../../../ui/Hud3D';
import Core from '../../../Core';
import ChangeTracker from 'change-tracker/src';
import Player from '../../../Player';
import * as THREE from 'three';

const helmView = Core.unifiedView.helm;
const propulsionView = Core.unifiedView.propulsion;

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  player: Player,
  hud3D: Hud3D,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: THREE.Camera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------

export default class VisorHud extends ShipModule {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  readonly friendlyName: string;
  _powerSource: any;

  private _throttle!: HudItem;
  private _speedIndicator!: HudItem;
  private _uiLoaded: boolean;

  constructor() {
    super();
    this.friendlyName = 'visor comms interface';
    this.powerNeeded = 0.1;
    this.bootPowerNeeded = 0.2;

    this._uiLoaded = false;
    this._powerSource = null;

    this._setupUi();
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
    this._pluginCache.hud3D.setScreenPage(page, this._pluginCache.camera);

    ChangeTracker.waitForAll([
      this._throttle.onMeshLoaded,
      this._speedIndicator.onMeshLoaded,
    ]).getOnce(() => {
      this._uiLoaded = true;
      // this._throttle._debugDetachFromFace();
      // this._speedIndicator._debugDetachFromFace();
    });
  }

  connectPowerSource(device) {
    this._powerSource = device;
  }

  step() {
    if (!this._powerSource || !this._uiLoaded) {
      return;
    }

    // TODO: on power dim, consider implementing this, it's very satisfying:
    // this.throttle.setProgress(Math.random(), true);

    this._throttle.setProgress(
      helmView.throttlePrettyPosition,
      propulsionView.outputLevelPretty,
    );
  }
}
