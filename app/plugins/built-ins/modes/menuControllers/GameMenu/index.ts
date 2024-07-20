import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import { ReactBase } from '../../../ReactBase';
import InputBridge from '../../../ReactBase/types/InputBridge';
import { ModeId } from '../../../InputManager/types/ModeId';
import MenuControlSetup from './MenuComponents/MenuControlSetup';
import { gameMenuControls } from './controls';

const MENU_NAME = 'controlsMenu';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  reactBase: ReactBase,
};
type Dependencies = typeof pluginDependencies;
const pluginList = Object.keys(pluginDependencies);

// -- ✀ -----------------------------------------------------------------------+

class GameMenu {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private _inputBridge = new InputBridge(
    MENU_NAME, ModeId.primaryGameMenu, gameMenuControls, true,
  );

  constructor() {
    this._inputBridge.autoConfigurePulseKeys([
      'back', 'select', 'saveChanges', 'delete', 'resetBinding', 'search',
      'advanced', 'manageMacros', 'emergencyMenuClose',
    ]);

    this._pluginCache.reactBase.registerMenu({
      getInputBridge: () => this._inputBridge,
      getComponent: () => MenuControlSetup,
    });
  }
}

const gameMenuPlugin = new CosmosisPlugin(
  'gameMenu', GameMenu, pluginDependencies,
);

export {
  GameMenu,
  gameMenuPlugin,
};
