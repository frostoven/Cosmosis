// @formatter:off
// ^ Control-binding files become unreadable when formatted.

import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../../../configs/types/InputTypes';
import { genAutoFriendlyNames } from '../../InputManager/utils';

const cockpitLightControls: ControlSchema = {
  cycleCockpitLights: {
    actionType: ActionType.pulse,
    current: null,
    // default: [
    //   'Numpad0',
    //   'bt7',
    // ],
    // default: [
    //   { key: 'Numpad0', inputType: InputType.keyboardButton },
    //   { key: 'bt7', inputType: InputType.gamepadButton },
    // ],
    // default: {
    //   'Numpad0': InputType.keyboardButton,
    //   'bt7': InputType.gamepadButton,
    //   'bt0': InputType.gamepadButton,
    // },
    default: { 'Numpad0': InputType.keyboardButton, /*'bt7': InputType.gamepadButton, 'bt0': InputType.gamepadButton*/ },
  },
  // TODO: display in controls menu as 'Cycle cockpit lights (held)'
  cycleCockpitLightsHeld: {
    actionType: ActionType.continuous,
    current: null,
    default: { 'NumpadDecimal': InputType.keyboardButton, 'Numpad7': InputType.keyboardButton, /*'bt6': InputType.gamepadButton, 'bt1': InputType.gamepadButton*/ },
  },
  // 'continuous key test': {
  //   actionType: ActionType.continuous,
  //   current: null,
  //   // default: [
  //   //   { key: 'Numpad7', inputType: InputType.keyboardButton },
  //   //   { key: 'bt6', inputType: InputType.gamepadButton },
  //   // ],
  //   default: {
  //     'Numpad7': InputType.keyboardButton,
  //     'bt6': InputType.gamepadButton,
  //   },
  // },
};

genAutoFriendlyNames(cockpitLightControls);

export {
  cockpitLightControls,
};
