// @formatter:off
// ^ Control-binding files become unreadable when formatted.

import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../configs/types/InputTypes';
import { genAutoFriendlyNames } from '../../InputManager/utils';

const externalLightControls: ControlSchema = {
  cycleExternalLights: { actionType: ActionType.pulse, current: null, default: { KeyL: InputType.keyboardButton } },
};

genAutoFriendlyNames(externalLightControls);

export {
  externalLightControls,
};
