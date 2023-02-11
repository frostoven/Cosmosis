import { ActionType } from '../types/ActionType';
import { InputType } from '../types/InputTypes';

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
    strictlyBidirectionalAnalog?: boolean,
  };
}

export {
  ControlSchema,
};
