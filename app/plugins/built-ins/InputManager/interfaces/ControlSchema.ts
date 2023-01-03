import { ActionType } from '../types/ActionType';

interface ControlSchema {
  [key: string]: {
    // Continuous, toggle, etc.
    actionType: ActionType,
    // If using keyboard in analog context, what amount of change does the
    // keyboard output? If not set, this should be treated as 1.
    kbAmount?: number,
    // Current keybinding.
    current: Array<string> | null,
    // Default keybinding.
    default: Array<string>,
    allowKeyConflicts?: Array<string>,
  }
}

export {
  ControlSchema,
}
