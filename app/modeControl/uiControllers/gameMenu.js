import contextualInput from '../../local/contextualInput';
import { getUiEmitter } from '../../emitters';
import { keySchema } from '../../local/controls';

const { primaryMenu, ActionType } = contextualInput;
const gameMenuMode = primaryMenu.enroll('gameMenu', true);

const uiEmitter = getUiEmitter();

// const pressActions = {
//   showKeyBindings: () => { // F1 // TODO: remove?
//     // $game.ptrLockControls.unlock();
//     // uiEmitter.emit('toggleControlsMenuReadOnly');
//   },
//   // showMenu: () => { // Esc
//   back: () => { // Esc
//     // setMode(modes.pauseMenu); // TODO: change how this works.
//     $game.ptrLockControls.unlock();
//     // uiEmitter.emit('showMenu');
//     uiEmitter.emit('back');
//   },
//   select: () => {},
//   confirmChanges: () => {},
//   up: () => {},
//   down: () => {},
//   left: () => {},
//   right: () => {},
// };

// This is js module is simply a passthrough for the UI, which means we can
// dynamically generate the key listener's object.
const uiActions = {};
const actions = keySchema.gameMenu;
for (let i = 0, len = actions.length; i < len; i++) {
  const action = actions[i];
  uiActions[action] = (data) => {
    uiEmitter.emit(action, data);
  };
}

primaryMenu.onActions({
  actionType: ActionType.keyUp | ActionType.keyDown,
  actionNames: Object.keys(uiActions),
  modeName: gameMenuMode,
  callback: onKeyPress,
});

function onKeyPress({ action, isDown }) {
  const fn = uiActions[action];
  if (fn) {
    fn({ action, isDown });
  }
  else {
    console.error(
      `modeControl.primaryMenu.gameMenu: no action exists named "${action}".`
    );
  }
}

export default {
  init: () => {},
}
