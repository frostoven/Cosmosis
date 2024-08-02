import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import { ReactBase } from '../../../ReactBase';
import InputBridge from '../../../ReactBase/types/InputBridge';
import { ModeId } from '../../../InputManager/types/ModeId';
import { NavigationConsole } from './NavigationConsole';
import { navMenuControls } from './controls';

const MENU_NAME = 'navMenu';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  reactBase: ReactBase,
};
type Dependencies = typeof pluginDependencies;
const pluginList = Object.keys(pluginDependencies);

// -- ✀ -----------------------------------------------------------------------+

class NavMenu {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private _inputBridge = new InputBridge(
    MENU_NAME, ModeId.virtualMenuControl, navMenuControls, true,
  );

  constructor() {
    this._pluginCache.reactBase.registerMenu({
      getInputBridge: () => this._inputBridge,
      getComponent: () => NavigationConsole,
    });
  }
}

const navMenuPlugin = new CosmosisPlugin(
  'navMenu', NavMenu, pluginDependencies,
);

export {
  NavMenu,
  navMenuPlugin,
};
