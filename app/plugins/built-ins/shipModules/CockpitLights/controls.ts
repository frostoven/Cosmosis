import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';

const cockpitLightControls: ControlSchema = {
  cycleCockpitLights: { actionType: ActionType.pulse, current: null, default: [ 'Numpad0' ] },
};

export {
  cockpitLightControls,
};
