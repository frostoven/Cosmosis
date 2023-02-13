import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';

const externalLightControls: ControlSchema = {
  cycleExternalLights: { actionType: ActionType.pulse, current: null, default: [ 'KeyL' ] },
};

export {
  externalLightControls,
};
