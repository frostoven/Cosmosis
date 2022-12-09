import CosmosisPlugin from '../../../../types/CosmosisPlugin';
import ModeController from '../../../InputManager/types/ModeController';
import { generalControls } from './controls';
import { gameRuntime } from '../../../../gameRuntime';
import { ModeId } from '../../../InputManager/types/ModeId';

class GeneralControl extends ModeController {
  constructor() {
    super('general', ModeId.appControl, generalControls);

    this.pulse.devChangeCamMode.getEveryChange(() => {
      console.log('under construction');
    });

    this.pulse.toggleMousePointer.getEveryChange(() => {
      console.log('under construction');
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

const generalControlPlugin = new CosmosisPlugin('generalControlPlugin', GeneralControl);

export {
  GeneralControl,
  generalControlPlugin,
}
