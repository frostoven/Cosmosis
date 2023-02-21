import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../InputManager/types/InputTypes';

const warpDriveControls: ControlSchema = {
  engageWarpDrive:    { actionType: ActionType.pulse, current: null, default: { KeyJ: InputType.keyboardButton } },
};

export {
  warpDriveControls,
};
