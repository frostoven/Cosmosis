import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { DefaultInputSpeeds } from '../../../InputManager/types/DefaultInputSpeeds';
import { genAutoFriendlyNames } from '../../../InputManager/utils';

const { continuous, hybrid } = ActionType;

const {
  keyboardButton, gamepadButton, analogStickAxis, mouseAxisInfinite,
  analogSlider, scrollWheel,
} = InputType;

const {
  kbLookSpeed,
  kbRotationSpeed,
  gamepadButtonLookSpeed,
  gamepadButtonRotationSpeed,
  analogStickLookSpeed,
  analogStickGhostWalkSpeed,
  mouseAxisInfiniteLookSpeed,
} = DefaultInputSpeeds;

const defaultButtonLookMulti = {
  keyboardButton: kbLookSpeed, gamepadButton: gamepadButtonLookSpeed,
};

const defaultButtonRollMulti = {
  keyboardButton: kbRotationSpeed, gamepadButton: gamepadButtonRotationSpeed,
};

const defaultBidirectionalLookMulti = {
  analogStickAxis: analogStickLookSpeed,
  mouseAxisInfinite: mouseAxisInfiniteLookSpeed,
};

const defaultBidirectionalMoveMulti = {
  analogStickAxis: analogStickGhostWalkSpeed,
  mouseAxisInfinite: mouseAxisInfiniteLookSpeed,
};

const freeCamControls: ControlSchema = {
  // Basic controls
  moveForward:         { actionType: continuous, sign: -1, analogRemap: 'moveForwardBackward', current: null, default: { KeyW: keyboardButton, ArrowUp: keyboardButton } },
  moveBackward:        { actionType: continuous, sign:  1, analogRemap: 'moveForwardBackward', current: null, default: { KeyS: keyboardButton, ArrowDown: keyboardButton } },
  moveForwardBackward: { actionType: continuous, current: null, default: { ax1: analogStickAxis, ha5: analogSlider }, isBidirectional: true, multiplier: { ...defaultBidirectionalMoveMulti } },
  //
  moveLeft:            { actionType: continuous, sign: -1, analogRemap: 'moveLeftRight', current: null, default: { ArrowLeft: keyboardButton, KeyA: keyboardButton } },
  moveRight:           { actionType: continuous, sign:  1, analogRemap: 'moveLeftRight', current: null, default: { ArrowRight: keyboardButton, KeyD: keyboardButton } },
  moveLeftRight:       { actionType: continuous, current: null, default: { ax0: analogStickAxis }, isBidirectional: true, multiplier: { ...defaultBidirectionalMoveMulti } },
  //
  moveUp:              { actionType: continuous, sign:  1, analogRemap: 'moveUpDown', current: null, default: { KeyR: keyboardButton, Space: keyboardButton, bt3: gamepadButton } },
  moveDown:            { actionType: continuous, sign: -1, analogRemap: 'moveUpDown', current: null, default: { KeyF: keyboardButton, bt0: gamepadButton } },
  moveUpDown:          { actionType: continuous, current: null, default: null, isBidirectional: true, multiplier: { ...defaultBidirectionalMoveMulti } },
  //
  speedUp:             { actionType: hybrid, current: null, default: { NumpadAdd: keyboardButton, spScrollUp: scrollWheel } },
  slowDown:            { actionType: hybrid, current: null, default: { NumpadSubtract: keyboardButton, spScrollDown: scrollWheel } },
  doubleSpeed:         { actionType: continuous, current: null, default: { ShiftLeft: keyboardButton, ShiftRight: keyboardButton } },
  halfSpeed:           { actionType: continuous, current: null, default: { AltLeft: keyboardButton, AltRight: keyboardButton } },
  //
  // Analog and look-around
  //
  lookUp:        { actionType: continuous, sign: -1, analogRemap: 'lookUpDown', current: null, default: { Numpad8: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookDown:      { actionType: continuous, sign:  1, analogRemap: 'lookUpDown', current: null, default: { Numpad2: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookUpDown:    { actionType: continuous, current: null, default: { spNorthSouth: mouseAxisInfinite, ax3: analogStickAxis }, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },
  //
  rollLeft:      { actionType: continuous, sign: -1, analogRemap: 'rollAnalog', current: null, default: { bt6: gamepadButton, Numpad7: keyboardButton }, multiplier: { ...defaultButtonRollMulti } },
  rollRight:     { actionType: continuous, sign:  1, analogRemap: 'rollAnalog', current: null, default: { bt7: gamepadButton, Numpad9: keyboardButton }, multiplier: { ...defaultButtonRollMulti } },
  rollAnalog: { actionType: continuous, current: null, default: null, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },
  //
  lookLeft:      { actionType: continuous, sign: -1, analogRemap: 'lookLeftRight', current: null, default: { Numpad4: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookRight:     { actionType: continuous, sign:  1, analogRemap: 'lookLeftRight', current: null, default: { Numpad6: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookLeftRight: { actionType: continuous, current: null, default: { spEastWest: mouseAxisInfinite, ax2: analogStickAxis }, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },

  // Pulsed values
  interact:      { actionType: ActionType.pulse, current: null, default: { KeyE: keyboardButton } },

  // Dev controls.
  _devChangeCamMode:   { actionType: ActionType.pulse, current: null, default: { F7: keyboardButton, F8: keyboardButton } },
};

genAutoFriendlyNames(freeCamControls);

export {
  freeCamControls,
};
