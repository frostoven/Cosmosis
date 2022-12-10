import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';

const generalControls: ControlSchema = {
  toggleMousePointer: { actionType: ActionType.pulse, current: null, default: [ 'ControlLeft' ] },
  toggleFullScreen:   { actionType: ActionType.pulse, current: null, default: [ 'F11' ] },
  showDevConsole:     { actionType: ActionType.pulse, current: null, default: [ 'F12' ] },
};

export {
  generalControls,
};
