// @formatter:off
// ^ Control-binding files become unreadable when formatted.

import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { genAutoFriendlyNames } from '../../../InputManager/utils';

const { continuous, pulse } = ActionType;
const { keyboardButton } = InputType;

const navMenuControls: ControlSchema = {
  up:           { actionType: continuous, current: null, default: { ArrowUp: keyboardButton, KeyW: keyboardButton } },
  down:         { actionType: continuous, current: null, default: { ArrowDown: keyboardButton, KeyS: keyboardButton } },
  left:         { actionType: continuous, current: null, default: { ArrowLeft: keyboardButton, KeyQ: keyboardButton } },
  right:        { actionType: continuous, current: null, default: { ArrowRight: keyboardButton, KeyE: keyboardButton } },
  select:       { actionType: pulse,      current: null, default: { Enter: keyboardButton, NumpadEnter: keyboardButton } },
};

genAutoFriendlyNames(navMenuControls);

export {
  navMenuControls,
};
