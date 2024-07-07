import CosmosisPlugin from '../../types/CosmosisPlugin';
import { PointerLockControls } from './types/PointerLockControls';
import { logBootTitleAndInfo } from '../../../local/windowLoadListener';
import Core from '../Core';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import PluginLoader from '../../types/PluginLoader';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

// Note: this relates to how the mouse works with the game window. It has
// nothing to do with mounting rodents, though we may or may not have such
// implementation plans.
class MouseDriver extends PointerLockControls {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private readonly _superLock: Function;

  constructor() {
    logBootTitleAndInfo('Driver', 'Enhanced Precision Driver', PluginLoader.bootLogIndex);
    let pointerLockTarget: HTMLElement;
    const canvas = document.getElementById('near-object-canvas');
    if (canvas) {
      pointerLockTarget = canvas;
    }
    else {
      console.error('Could not find the near-object-canvas');
      pointerLockTarget = document.body;
    }
    super(pointerLockTarget);

    const core = this._pluginCache.core;
    core.onAnimateDone.getEveryChange(this.step.bind(this));

    // TODO: on app gain focus, steal escape. On blur, discard escape. This
    //  hopefully allows us to control unintentional ctrl lockouts better.
    //  See issue #91

    // Because our base class uses an incompatible methodology, we need to
    // duck-punch our overrides in, 90's style.
    // @ts-ignore - Comes from PointerLockControls.
    this._superLock = this.lock;
    // @ts-ignore - Comes from PointerLockControls.
    this.lock = this._lockOverride;

    // TODO: auto-lock if the window has focus, else skip.
    // this.lock();
  }

  _lockOverride() {
    // @ts-ignore TS2304 - it really is real, TS, I promise.
    const sasquatch = nw.Window.get();
    // This acts like a click without actually sending a click event. Allows
    // 'lock' to work in far more cases where the beast would otherwise escape.
    // sasquatch.blur();
    // sasquatch.focus();
    this._superLock();
  };

  step() {
    // this.updateOrientation();
  }
}

const mouseDriverPlugin = new CosmosisPlugin(
  'mouseDriver', MouseDriver, pluginDependencies,
);

export {
  MouseDriver,
  mouseDriverPlugin,
};
