import { ActionType } from '../types/ActionType';

interface ControlSchema {
  [key: string]: {
    // Continuous, toggle, etc.
    actionType: ActionType,
    // Current keybinding.
    current: Array<string> | null,
    // Default keybinding.
    default: Array<string>,
  }
}

export {
  ControlSchema,
}
