import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { genAutoFriendlyNames } from '../../../InputManager/utils';

const { pulse, continuous } = ActionType;
const { keyboardButton, gamepadButton, analogStickAxis, mouseButton,
  mouseAxisInfinite, mouseAxisGravity, mouseAxisThreshold, analogSlider,
  scrollWheel,
} = InputType;

const shipPilotControls: ControlSchema = {
  // Pulsed
  thrustUp10:          { actionType: pulse, current: null, default: { spScrollUp: scrollWheel }, friendly: 'Thrust Increase (10%)' },
  thrustReset:         { actionType: pulse, current: null, default: { spScrollDown: scrollWheel } },
  mouseHeadLook:       { actionType: pulse, current: null, default: { spMouseMiddle: mouseButton, Numpad5: keyboardButton, bt11: gamepadButton, bt10: gamepadButton } },
  toggleFlightAssist:  { actionType: pulse, current: null, default: { KeyZ: keyboardButton } },
  //
  // Continuous
  //
  thrustInc:     { actionType: continuous, sign: -1, analogRemap: 'thrustAnalog', current: null, default: { KeyW: keyboardButton } },
  thrustDec:     { actionType: continuous, sign:  1, analogRemap: 'thrustAnalog', current: null, default: { KeyS: keyboardButton } },
  thrustAnalog:  { actionType: continuous, current: null, default: { ax1: analogStickAxis, ha5: analogSlider }, isBidirectional: true },
  //
  pitchUp:       { actionType: continuous, sign: -1, analogRemap: 'pitchAnalog', current: null, default: { Numpad8: keyboardButton } },
  pitchDown:     { actionType: continuous, sign:  1, analogRemap: 'pitchAnalog', current: null, default: { Numpad2: keyboardButton } },
  pitchAnalog:   { actionType: continuous, current: null, default: { spNorthSouth: mouseAxisThreshold, ax3: InputType.analogStickAxis }, isBidirectional: true },
  //
  rollLeft:      { actionType: continuous, sign:  1, current: null, default: { KeyA: keyboardButton } },
  rollRight:     { actionType: continuous, sign: -1, current: null, default: { KeyD: keyboardButton } },
  yawLeft:       { actionType: continuous, sign: -1, current: null, default: { spWest: mouseAxisGravity, Numpad4: keyboardButton } },
  yawRight:      { actionType: continuous, sign:  1, current: null, default: { spEast: mouseAxisGravity, Numpad6: keyboardButton  } },
  //
  lookUp:        { actionType: continuous, sign: -1, current: null, default: { spNorth: mouseAxisInfinite, Numpad8: keyboardButton }, allowKeyConflicts: [ 'pitchUp' ] },
  lookDown:      { actionType: continuous, sign:  1, current: null, default: { spSouth: mouseAxisInfinite, Numpad2: keyboardButton }, allowKeyConflicts: [ 'pitchDown' ] },
  lookLeft:      { actionType: continuous, sign: -1, current: null, default: { spWest: mouseAxisInfinite,  Numpad4: keyboardButton }, allowKeyConflicts: [ 'yawLeft' ] },
  lookRight:     { actionType: continuous, sign:  1, current: null, default: { spEast: mouseAxisInfinite,  Numpad6: keyboardButton }, allowKeyConflicts: [ 'yawRight' ] },
  //
  // Dev controls.
  //
  _debugFullWarpSpeed: { actionType: pulse, current: null, default: { ScrollLock: keyboardButton } },
  _devChangeCamMode:   { actionType: pulse, current: null, default: { F7: keyboardButton, F8: keyboardButton } },
};

genAutoFriendlyNames(shipPilotControls);

export {
  shipPilotControls,
};
