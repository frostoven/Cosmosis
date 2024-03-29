// Used for keys that apply everywhere, such as fullscreening.

import contextualInput from '../../local/contextualInput';
import { getStartupEmitter, startupEvent } from '../../emitters';

const { misc, camController, ActionType } = contextualInput;
const generalMode = misc.enroll('general', true);

const startupEmitter = getStartupEmitter();

const actions = {
  _devChangeCamMode: () => {
    if (camController.getActiveMode() === 'shipPilot') {
      camController.giveControlTo('freeCam');
    }
    else {
      camController.giveControlTo('shipPilot');
    }
  },
  toggleFullScreen: () => {
    nw.Window.get().toggleFullscreen();
  },
  toggleMousePointer: () => {
    $game.ptrLockControls.toggle();
  },
  showDevConsole: () => {
    nw.Window.get().showDevTools();
  },
};

startupEmitter.on(startupEvent.gameViewReady, () => {
  // Key press actions.
  misc.replaceActions({
    actionType: ActionType.keyPress,
    actionNames: Object.keys(actions),
    modeName: generalMode,
    callback: onKeyPress,
  });
});

function onKeyPress({ action }) {
  const fn = actions[action];
  if (fn) {
    fn();
  }
  else {
    console.error(
      `modeControl.misc.general: no action exists named "${action}".`
    );
  }
}

export default {
  init: () => {},
}
