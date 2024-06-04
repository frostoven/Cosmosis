// @formatter:off
// ^ Control-binding files become unreadable when formatted.

import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { DefaultInputSpeeds } from '../../../InputManager/types/DefaultInputSpeeds';
import { genAutoFriendlyNames } from '../../../InputManager/utils';

const { pulse, continuous } = ActionType;
const { keyboardButton, gamepadButton, gamepadAxisStandard, mouseButton,
  mouseAxisStandard, mouseAxisGravity, mouseAxisThreshold, gamepadSlider,
  scrollWheel,
} = InputType;

const {
  kbAsSlider, gamepadStickAsSlider, gamepadStickAsSteering,
  analogStickLookSpeed, mouseAxisStandardLookSpeed,
} = DefaultInputSpeeds;

const defaultBidirectionalLookMulti = {
  gamepadAxisStandard: gamepadStickAsSteering,
  mouseAxisStandard: mouseAxisStandardLookSpeed,
};

const helmControls: ControlSchema = {
  //
  // Pulsed
  //
  thrustUp10:          { actionType: pulse, current: null, default: { spScrollUp: scrollWheel }, friendly: 'Thrust Increase (10%)' },
  thrustReset:         { actionType: pulse, current: null, default: { spScrollDown: scrollWheel } },
  mouseHeadLook:       { actionType: pulse, current: null, default: { spMouseMiddle: mouseButton, Numpad5: keyboardButton, bt11: gamepadButton, bt10: gamepadButton } },
  toggleFlightAssist:  { actionType: pulse, current: null, default: { KeyZ: keyboardButton } },
  cycleEngineType:     { actionType: pulse, current: null, default: { KeyJ: keyboardButton } },
  //
  // Continuous
  //
  thrustInc:     { actionType: continuous, sign: -1, multiplier: { keyboardButton: kbAsSlider }, analogRemap: 'thrustAnalog', current: null, default: { KeyW: keyboardButton } },
  thrustDec:     { actionType: continuous, sign:  1, multiplier: { keyboardButton: kbAsSlider }, analogRemap: 'thrustAnalog', current: null, default: { KeyS: keyboardButton } },
  thrustAnalog:  { actionType: continuous, multiplier: { gamepadAxisStandard: gamepadStickAsSlider, }, current: null, default: { ax1: gamepadAxisStandard, ha2: gamepadSlider }, isBidirectional: true },
  //
  pitchUp:       { actionType: continuous, sign: -1, analogRemap: 'pitchAnalog', current: null, default: { Numpad8: keyboardButton } },
  pitchDown:     { actionType: continuous, sign:  1, analogRemap: 'pitchAnalog', current: null, default: { Numpad2: keyboardButton } },
  pitchAnalog:   { actionType: continuous, current: null, default: { spNorthSouth: mouseAxisThreshold, ax3: gamepadAxisStandard }, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },
  //
  rollLeft:      { actionType: continuous, sign: -1, analogRemap: 'rollAnalog', current: null, default: { KeyA: keyboardButton } },
  rollRight:     { actionType: continuous, sign:  1, analogRemap: 'rollAnalog', current: null, default: { KeyD: keyboardButton } },
  rollAnalog:    { actionType: continuous, current: null, default: { ax0: gamepadAxisStandard }, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },
  //
  yawLeft:       { actionType: continuous, sign: -1, analogRemap: 'yawAnalog', current: null, default: { Numpad4: keyboardButton } },
  yawRight:      { actionType: continuous, sign:  1, analogRemap: 'yawAnalog', current: null, default: { Numpad6: keyboardButton  } },
  yawAnalog:     { actionType: continuous, current: null, default: { spEastWest: mouseAxisThreshold, ax2: gamepadAxisStandard }, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },
  //
  lookUp:        { actionType: continuous, sign: -1, current: null, default: { spNorth: mouseAxisStandard, Numpad8: keyboardButton }, allowKeyConflicts: [ 'pitchUp' ] },
  lookDown:      { actionType: continuous, sign:  1, current: null, default: { spSouth: mouseAxisStandard, Numpad2: keyboardButton }, allowKeyConflicts: [ 'pitchDown' ] },
  lookLeft:      { actionType: continuous, sign: -1, current: null, default: { spWest: mouseAxisStandard,  Numpad4: keyboardButton }, allowKeyConflicts: [ 'yawLeft' ] },
  lookRight:     { actionType: continuous, sign:  1, current: null, default: { spEast: mouseAxisStandard,  Numpad6: keyboardButton }, allowKeyConflicts: [ 'yawRight' ] },
  //
  // Dev controls.
  //
  _debugFullWarpSpeed: { actionType: pulse, current: null, default: { ScrollLock: keyboardButton } },
  _devChangeCamMode:   { actionType: pulse, current: null, default: { F7: keyboardButton, F8: keyboardButton } },
};

genAutoFriendlyNames(helmControls);

export {
  helmControls,
};
