import contextualInput from '../../local/contextualInput';
import { getUiEmitter } from '../../emitters';
import { keySchema } from '../../local/controls';

const { menuController, ActionType } = contextualInput;
const menuViewerMode = menuController.enroll('menuViewer', true);

const uiEmitter = getUiEmitter();

// This is js module is simply a passthrough for the UI, which means we can
// dynamically generate the key listener's object.
const uiActions = {};
const actions = keySchema.menuViewer;
for (let i = 0, len = actions.length; i < len; i++) {
  const action = actions[i];
  uiActions[action] = (data) => {
    uiEmitter.emit(action, data);
  };
}

menuController.replaceActions({
  actionType: ActionType.keyUp | ActionType.keyDown,
  actionNames: Object.keys(uiActions),
  modeName: menuViewerMode,
  callback: onKeyPress,
});

function onKeyPress({ action, isDown }) {
  const fn = uiActions[action];
  if (fn) {
    fn({ action, isDown });
  }
  else {
    console.error(
      `modeControl.reactController.menuViewer: no action exists named "${action}".`
    );
  }
}

export default {
  init: () => {},
  modeName: menuViewerMode,
}

// The joys of copy-paste.
export {
  menuViewerMode as modeName,
}
