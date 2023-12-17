import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { genAutoFriendlyNames } from '../../../InputManager/utils';

const { pulse, continuous } = ActionType;
const { keyboardButton } = InputType;

const generalControls: ControlSchema = {
  toggleMousePointer: { actionType: pulse, current: null, default: { ControlLeft: keyboardButton } },
  toggleFullScreen:   { actionType: pulse, current: null, default: { F11: keyboardButton } },
  showDevConsole:     { actionType: pulse, current: null, default: { F12: keyboardButton } },
};

genAutoFriendlyNames(generalControls);

export {
  generalControls,
};
