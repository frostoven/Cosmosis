import { ActionType } from '../../InputManager/types/ActionType';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';
import { InputType } from '../../InputManager/types/InputTypes';

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
    //   { key: 'bt7', inputType: InputType.analogButton },
    // ],
    // default: {
    //   'Numpad0': InputType.keyboardButton,
    //   'bt7': InputType.analogButton,
    //   'bt0': InputType.analogButton,
    // },
    default: { 'Numpad0': InputType.keyboardButton, 'bt7': InputType.analogButton, 'bt0': InputType.analogButton },
  },
  // TODO: display in controls menu as 'Cycle cockpit lights (held)'
  cycleCockpitLightsHeld: {
    actionType: ActionType.continuous,
    current: null,
    default: { 'NumpadDecimal': InputType.keyboardButton, 'Numpad7': InputType.keyboardButton, 'bt6': InputType.analogButton, 'bt1': InputType.analogButton },
  },
  // 'continuous key test': {
  //   actionType: ActionType.continuous,
  //   current: null,
  //   // default: [
  //   //   { key: 'Numpad7', inputType: InputType.keyboardButton },
  //   //   { key: 'bt6', inputType: InputType.analogButton },
  //   // ],
  //   default: {
  //     'Numpad7': InputType.keyboardButton,
  //     'bt6': InputType.analogButton,
  //   },
  // },
};

export {
  cockpitLightControls,
};
