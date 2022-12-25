import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';

const warpDriveControls: ControlSchema = {
  engageWarpDrive:    { actionType: ActionType.pulse, current: null, default: [ 'KeyJ' ] },
};

export {
  warpDriveControls,
};
