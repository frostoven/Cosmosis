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

class GeneralControl extends ModeController {
  private _mouseDriver: MouseDriver;
  private _reactBase: ReactBase;

  constructor() {
    const uiInfo = { friendly: 'General Controls', priority: 5 };
    super('general', ModeId.appControl, generalControls, uiInfo);

    this._mouseDriver = gameRuntime.tracked.mouseDriver.cachedValue;
    this._reactBase = gameRuntime.tracked.reactBase.cachedValue;

    this.pulse.openShipConsole.getEveryChange(() => {
      toggleBootWindow(true);
    });

    this.pulse.activateGameMenu.getEveryChange(() => {
      this._reactBase.getInputBridge().activateAndOpenMenu();
    });

    this.pulse.toggleMousePointer.getEveryChange(() => {
      this._mouseDriver.toggle();
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

  _setupWatchers() {
    gameRuntime.tracked.mouseDriver.getEveryChange((mouseDriver) => {
      this._mouseDriver = mouseDriver;
    });
  }
}

const generalControlPlugin = new CosmosisPlugin('generalControl', GeneralControl);

export {
  GeneralControl,
  generalControlPlugin,
}
