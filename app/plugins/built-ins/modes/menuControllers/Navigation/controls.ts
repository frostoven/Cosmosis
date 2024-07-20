// @formatter:off
// ^ Control-binding files become unreadable when formatted.

import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { genAutoFriendlyNames } from '../../../InputManager/utils';

const { continuous } = ActionType;
const { keyboardButton } = InputType;

const navMenuControls: ControlSchema = {
  up:           { actionType: continuous, current: null, default: { ArrowUp: keyboardButton } },
  down:         { actionType: continuous, current: null, default: { ArrowDown: keyboardButton } },
  left:         { actionType: continuous, current: null, default: { ArrowLeft: keyboardButton } },
  right:        { actionType: continuous, current: null, default: { ArrowRight: keyboardButton } },
};

genAutoFriendlyNames(navMenuControls);

export {
  navMenuControls,
};
