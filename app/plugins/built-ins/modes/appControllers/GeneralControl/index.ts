import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { generalControls } from './controls';
import { gameRuntime } from '../../../../gameRuntime';
import { ModeId } from '../../../InputManager/types/ModeId';
import { MouseDriver } from '../../../MouseDriver';
import { ReactBase } from '../../../ReactBase';
import {
  toggleBootWindow,
} from '../../../../../local/windowLoadListener';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  mouseDriver: MouseDriver,
  reactBase: ReactBase,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

class GeneralControl extends ModeController {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;

  constructor() {
    const uiInfo = { friendly: 'General Controls', priority: 5 };
    super('general', ModeId.appControl, generalControls, uiInfo);

    this.pulse.openShipConsole.getEveryChange(() => {
      toggleBootWindow(true);
    });

    this.pulse.activateGameMenu.getEveryChange(() => {
      this._reactBase.getInputBridge().activateAndOpenMenu();
    });

    this.pulse.toggleMousePointer.getEveryChange(() => {
      // @ts-ignore - This is inherited from PointerLockControls.
      this._pluginCache.mouseDriver.toggle();
    });

    this.pulse._devReloadGame.getEveryChange(() => {
      // @ts-ignore
      chrome.tabs.reload();
    });

    this.pulse.toggleFullScreen.getEveryChange(() => {
      // @ts-ignore
      nw.Window.get().toggleFullscreen();
    });

    this.pulse.showDevConsole.getEveryChange(() => {
      // @ts-ignore
      nw.Window.get().showDevTools();
    });

    // This controller activates itself by default:
    gameRuntime.tracked.inputManager.cachedValue.activateController(ModeId.appControl, this.name);
  }
}

const generalControlPlugin = new CosmosisPlugin('generalControl', GeneralControl);

export {
  GeneralControl,
  generalControlPlugin,
};
