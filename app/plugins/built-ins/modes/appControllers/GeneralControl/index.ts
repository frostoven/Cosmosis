import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { generalControls } from './controls';
import { gameRuntime } from '../../../../gameRuntime';
import { ModeId } from '../../../InputManager/types/ModeId';
import { MouseDriver } from '../../../MouseDriver';
import { InputManager } from '../../../InputManager';

class GeneralControl extends ModeController {
  private _mouseDriver: MouseDriver;

  constructor() {
    super('general', ModeId.appControl, generalControls);

    InputManager.allControlSchemes.generalControls = {
      key: 'generalControls',
      schema: generalControls,
      friendly: 'General Controls',
      priority: 5,
    };

    this._mouseDriver = gameRuntime.tracked.mouseDriver.cachedValue;

    this.pulse.toggleMousePointer.getEveryChange(() => {
      this._mouseDriver.toggle();
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
