import { Object3D, Scene } from 'three';
import CosmosisPlugin from '../../../types/CosmosisPlugin';
import HudPage from './types/HudPage';
import { gameRuntime } from '../../../gameRuntime';
import { logBootTitleAndInfo } from '../../../../local/windowLoadListener';
import PluginLoader from '../../../types/PluginLoader';

class Hud3D {
  private readonly _trackedParents: { [key: string]: { childPage: HudPage } };
  private _scene: any;
  private _activePageId: string;
  private _activeHudScene: null | Scene;

  constructor(pageId: string, hudBuilder: HudPage) {
    logBootTitleAndInfo('Driver', 'Visor System', PluginLoader.bootLogIndex);
    this._trackedParents = {
      // Example structure:
      // parentUuid: { childPage: new HudPage() },
    };

    // this._elements = {};
    this._scene = new Scene();
    this._activePageId = '';
    this._activeHudScene = null;
  }

  // This can in theory work with both holographic projection screens and the
  // player's visor, though it's only been tested with the player's visor. We
  // can probably implement some mesh codes that request things by page name.
  setScreenPage(page: HudPage, targetParent: Object3D) {
    gameRuntime.tracked.levelScene.getOnce((levelScene) => {
      const trackedParent = this._trackedParents[targetParent.uuid];

      if (trackedParent) {
        targetParent.remove(trackedParent.childPage.scene);
      }

      page.build(targetParent);
      this._trackedParents[targetParent.uuid] = { childPage:  page };
      targetParent.add(page.scene);
    });
  }
}

const hud3DPlugin = new CosmosisPlugin('hud3D', Hud3D);

export {
  Hud3D,
  hud3DPlugin,
}
