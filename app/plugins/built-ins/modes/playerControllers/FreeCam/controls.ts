import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../InputManager/types/InputTypes';

const { continuous } = ActionType;
const { keyboardButton, mouseAxisInfinite } = InputType;

const freeCamControls: ControlSchema = {
  // Basic controls
  moveForward:   { actionType: continuous, current: null, default: { KeyW: keyboardButton, ArrowUp: keyboardButton } },
  moveBackward:  { actionType: continuous, current: null, default: { KeyS: keyboardButton, ArrowDown: keyboardButton } },
  moveLeft:      { actionType: continuous, current: null, default: { ArrowLeft: keyboardButton, KeyA: keyboardButton } },
  moveRight:     { actionType: continuous, current: null, default: { ArrowRight: keyboardButton, KeyD: keyboardButton } },
  moveUp:        { actionType: continuous, current: null, default: { KeyR: keyboardButton, Space: keyboardButton } },
  moveDown:      { actionType: continuous, current: null, default: { KeyF: keyboardButton } },
  speedUp:       { actionType: continuous, current: null, default: { NumpadAdd: keyboardButton } },
  speedDown:     { actionType: continuous, current: null, default: { NumpadSubtract: keyboardButton } },
  doubleSpeed:   { actionType: continuous, current: null, default: { ShiftLeft: keyboardButton, ShiftRight: keyboardButton } },

  // Analog and look-around
  //
  lookUp:        { actionType: continuous, sign: -1, analogRemap: 'lookUpDown', current: null, default: { Numpad8: keyboardButton } },
  lookDown:      { actionType: continuous, sign:  1, analogRemap: 'lookUpDown', current: null, default: { Numpad2: keyboardButton } },
  lookUpDown:    { actionType: continuous, current: null, default: { spNorthSouth: mouseAxisInfinite, ax3: InputType.analogStickAxis }, strictlyBidirectionalAnalog: true },
  //
  //
  rollLeft:      { actionType: continuous, sign: -1, analogRemap: 'rollLeftRight', current: null, default: { Numpad7: keyboardButton } },
  rollRight:     { actionType: continuous, sign:  1, analogRemap: 'rollLeftRight', current: null, default: { Numpad9: keyboardButton } },
  rollLeftRight: { actionType: continuous, current: null, default: null, strictlyBidirectionalAnalog: true },
  // rollLeftRight: { triggers }
  //
  lookLeft:      { actionType: continuous, sign: -1, analogRemap: 'lookLeftRight', current: null, default: { Numpad4: keyboardButton } },
  lookRight:     { actionType: continuous, sign:  1, analogRemap: 'lookLeftRight', current: null, default: { Numpad6: keyboardButton } },
  lookLeftRight: { actionType: continuous, current: null, default: { spEastWest: mouseAxisInfinite, ax2: InputType.analogStickAxis }, strictlyBidirectionalAnalog: true },

  // Pulsed values
  interact:      { actionType: ActionType.pulse,         current: null, default: { KeyE: keyboardButton } },

  // Dev controls.
  _devChangeCamMode:   { actionType: ActionType.pulse, current: null, default: { F7: keyboardButton, F8: keyboardButton } },
};

export {
  freeCamControls,
};
