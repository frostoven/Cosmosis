import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../InputManager/types/InputTypes';

const { pulse, continuous } = ActionType;
const { keyboardButton, analogButton, mouseButton, mouseAxisInfinite, mouseAxisGravity } = InputType;

const shipPilotControls: ControlSchema = {
  // Pulsed controls
  thrustUp10:          { actionType: pulse, current: null, default: { spScrollUp: mouseButton } },
  thrustReset:         { actionType: pulse, current: null, default: { spScrollDown: mouseButton } },
  mouseHeadLook:       { actionType: pulse, current: null, default: { spMouseMiddle: mouseButton, Numpad5: keyboardButton, bt11: analogButton, bt10: analogButton } },
  toggleFlightAssist:  { actionType: pulse, current: null, default: { KeyZ: keyboardButton } },

  // Analog controls
  thrustInc:           { actionType: continuous, current: null, default: { KeyW: keyboardButton } },
  thrustDec:           { actionType: continuous, current: null, default: { KeyS: keyboardButton } },
  // TODO: see if we can create a hybrid mode that additive during free-look, but literal during lock.
  //  Alternatively, we'll need shipPilot to override action types directly as changes happen.
  pitchUp:             { actionType: continuous, kbAmount: -1, current: null, default: { spNorth: mouseAxisGravity, Numpad8: keyboardButton } },
  pitchDown:           { actionType: continuous, kbAmount:  1, current: null, default: { spSouth: mouseAxisGravity, Numpad2: keyboardButton } },
  rollLeft:            { actionType: continuous, kbAmount:  1, current: null, default: { KeyA: keyboardButton } },
  rollRight:           { actionType: continuous, kbAmount: -1, current: null, default: { KeyD: keyboardButton } },
  yawLeft:             { actionType: continuous, kbAmount: -1, current: null, default: { spWest: mouseAxisGravity, Numpad4: keyboardButton } },
  yawRight:            { actionType: continuous, kbAmount:  1, current: null, default: { spEast: mouseAxisGravity, Numpad6: keyboardButton  } },
  //
  lookUp:              { actionType: continuous, kbAmount: -1, current: null, default: { spNorth: mouseAxisInfinite, Numpad8: keyboardButton }, allowKeyConflicts: [ 'pitchUp' ] },
  lookDown:            { actionType: continuous, kbAmount:  1, current: null, default: { spSouth: mouseAxisInfinite, Numpad2: keyboardButton }, allowKeyConflicts: [ 'pitchDown' ] },
  lookLeft:            { actionType: continuous, kbAmount: -1, current: null, default: { spWest: mouseAxisInfinite,  Numpad4: keyboardButton }, allowKeyConflicts: [ 'yawLeft' ] },
  lookRight:           { actionType: continuous, kbAmount:  1, current: null, default: { spEast: mouseAxisInfinite,  Numpad6: keyboardButton }, allowKeyConflicts: [ 'yawRight' ] },

  // Dev controls.
  _debugFullWarpSpeed: { actionType: pulse, current: null, default: { ScrollLock: keyboardButton } },
  _devChangeCamMode:   { actionType: pulse, current: null, default: { F7: keyboardButton, F8: keyboardButton } },
};

export {
  shipPilotControls,
};
