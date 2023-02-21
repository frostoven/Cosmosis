import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../InputManager/types/InputTypes';

const externalLightControls: ControlSchema = {
  cycleExternalLights: { actionType: ActionType.pulse, current: null, default: { KeyL: InputType.keyboardButton } },
};

export {
  externalLightControls,
};
