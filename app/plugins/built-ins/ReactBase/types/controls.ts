import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../InputManager/types/InputTypes';
import { genAutoFriendlyNames } from '../../InputManager/utils';

const { pulse, continuous } = ActionType;
const { keyboardButton, analogButton, mouseButton } = InputType;

const reactMenuControls: ControlSchema = {
  // Keys that may be held
  up:           { actionType: continuous, current: null, default: { ArrowUp: keyboardButton } },
  down:         { actionType: continuous, current: null, default: { ArrowDown: keyboardButton } },
  left:         { actionType: continuous, current: null, default: { ArrowLeft: keyboardButton } },
  right:        { actionType: continuous, current: null, default: { ArrowRight: keyboardButton } },
  // Single presses
  back:         { actionType: pulse, current: null, default: { Backspace: keyboardButton } },
  select:       { actionType: pulse, current: null, default: { Enter: keyboardButton } },
  saveChanges:  { actionType: pulse, current: null, default: { F10: keyboardButton } },
  delete:       { actionType: pulse, current: null, default: { Delete: keyboardButton } },
  search:       { actionType: pulse, current: null, default: { Slash: keyboardButton } },
  advanced:     { actionType: pulse, current: null, default: { F3: keyboardButton } },
  manageMacros: { actionType: pulse, current: null, default: { F4: keyboardButton } },
  emergencyMenuClose: { actionType: pulse, current: null, default: { KeyQ: keyboardButton } },
};

genAutoFriendlyNames(reactMenuControls);

export {
  reactMenuControls,
};
