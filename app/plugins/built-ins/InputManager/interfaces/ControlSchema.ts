import { ActionType } from '../types/ActionType';
import { InputType } from '../types/InputTypes';

interface ControlSchema {
  [key: string]: {
    // Continuous, toggle, etc.
    actionType: ActionType,
    // If using keyboard in analog context, what amount of change does the
    // keyboard output? If not set, this should be treated as 1.
    kbAmount?: number,
    // // Current keybinding.
    // current: Array<{ key: string, inputType: InputType }> | null,
    // // Default keybinding.
    // default: Array<{ key: string, inputType: InputType }>,

    // Current keybinding.
    current: { [key: string]: InputType } | null,
    // Default keybinding.
    default: { [key: string]: InputType },

    allowKeyConflicts?: Array<string>,
  };
}

export {
  ControlSchema,
};
