// @formatter:off
// ^ Control-binding files become unreadable when formatted.

import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../../configs/types/InputTypes';
import { DefaultInputSpeeds } from '../../../InputManager/types/DefaultInputSpeeds';
import { genAutoFriendlyNames } from '../../../InputManager/utils';


const { continuous } = ActionType;

const {
  keyboardButton, gamepadAxisStandard, mouseAxisStandard,
} = InputType;

const {
  kbLookSpeed,
  gamepadButtonLookSpeed,
  analogStickLookSpeed,
  mouseAxisStandardLookSpeed,
} = DefaultInputSpeeds;

const defaultButtonLookMulti = {
  keyboardButton: kbLookSpeed, gamepadButton: gamepadButtonLookSpeed,
};

const defaultBidirectionalLookMulti = {
  gamepadAxisStandard: analogStickLookSpeed,
  mouseAxisStandard: mouseAxisStandardLookSpeed,
};

const buckledPassengerControls: ControlSchema = {
  //
  // Continuous
  //
  lookUp:        { actionType: continuous, sign: -1, analogRemap: 'lookUpDown', current: null, default: { Numpad8: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookDown:      { actionType: continuous, sign:  1, analogRemap: 'lookUpDown', current: null, default: { Numpad2: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookUpDown:    { actionType: continuous, current: null, default: { spNorthSouth: mouseAxisStandard, ax3: gamepadAxisStandard }, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },
  //
  lookLeft:      { actionType: continuous, sign: -1, analogRemap: 'lookLeftRight', current: null, default: { Numpad4: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookRight:     { actionType: continuous, sign:  1, analogRemap: 'lookLeftRight', current: null, default: { Numpad6: keyboardButton }, multiplier: { ...defaultButtonLookMulti } },
  lookLeftRight: { actionType: continuous, current: null, default: { spEastWest: mouseAxisStandard, ax2: gamepadAxisStandard }, isBidirectional: true, multiplier: { ...defaultBidirectionalLookMulti } },
};

genAutoFriendlyNames(buckledPassengerControls);

export {
  buckledPassengerControls,
};
