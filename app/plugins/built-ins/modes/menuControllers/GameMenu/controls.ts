// @formatter:off
// ^ Control-binding files become unreadable when formatted.

import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { genAutoFriendlyNames } from '../../../InputManager/utils';

const { pulse, continuous } = ActionType;
const { keyboardButton } = InputType;

const gameMenuControls: ControlSchema = {
  // Keys that may be held
  up:           { actionType: continuous, current: null, default: { ArrowUp: keyboardButton } },
  down:         { actionType: continuous, current: null, default: { ArrowDown: keyboardButton } },
  left:         { actionType: continuous, current: null, default: { ArrowLeft: keyboardButton } },
  right:        { actionType: continuous, current: null, default: { ArrowRight: keyboardButton } },
  // Single presses
  back:         { actionType: pulse, current: null, default: { Backspace: keyboardButton } },
  select:       { actionType: pulse, current: null, default: { Enter: keyboardButton } },
  saveChanges:  { actionType: pulse, current: null, default: { F10: keyboardButton } },
  delete:       { actionType: pulse, current: null, default: { Delete: keyboardButton, KeyX: keyboardButton } },
  resetBinding: { actionType: pulse, current: null, default: { KeyR: keyboardButton } },
  search:       { actionType: pulse, current: null, default: { Slash: keyboardButton, F3: keyboardButton } },
  advanced:     { actionType: pulse, current: null, default: { F6: keyboardButton } },
  manageMacros: { actionType: pulse, current: null, default: { F4: keyboardButton } },
  emergencyMenuClose: { actionType: pulse, current: null, default: { KeyQ: keyboardButton } },
};

genAutoFriendlyNames(gameMenuControls);

export {
  gameMenuControls,
};
