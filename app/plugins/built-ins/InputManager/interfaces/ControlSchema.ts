import { ActionType } from '../types/ActionType';
import { InputType, InputTypeKeyFields } from '../types/InputTypes';

interface ControlSchema {
  [key: string]: {
    // Continuous, toggle, etc.
    actionType: ActionType,
    // The direction in which the value goes.
    // @deprecated
    sign?: number,
    // Used for cases where digital keys are used in analog contexts. This
    // should almost always be used with the sign option.
    analogRemap?: string,
    // Multiplies the input value by the defined amount. Each property defaults
    // to 1 during init.
    multiplier?: InputTypeKeyFields,

    // // Current keybinding.
    // current: Array<{ key: string, inputType: InputType }> | null,
    // // Default keybinding.
    // default: Array<{ key: string, inputType: InputType }>,

    // Current keybinding.
    current: { [key: string]: InputType } | null,
    // Default keybinding.
    default: { [key: string]: InputType } | null,

    allowKeyConflicts?: Array<string>,

    // If true, only the mouse and analog sticks are allowed to interface with
    // control.
    isBidirectional?: boolean,
  };
}

export {
  ControlSchema,
};
