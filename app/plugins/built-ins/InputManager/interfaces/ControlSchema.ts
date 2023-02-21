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

    // Useful for dividing a gamepad stick or mouse axis into two halves. Must
    // be used with allowKeyConflicts, otherwise the application will refuse to
    // bind the other half to a different control.
    disallowSign?: -1 | 1 | 0;

    // Remaps the action to something else if a threshold is met. This is
    // useful, for example, when a device (such as a Warthog throttle) is
    // physically modded to support an afterburner. Beyond the specified
    // threshold, a new action is triggered.
    // This is currently only supported by slider types, and the remap target
    // should always be a pulse.
    repurposeThreshold?: {
      // The point at which the remap is triggered.
      // Dev note: the natural stopping point for the Thrustmaster Warthog is
      // -0.3599463105201721.
      threshold: number,
      // The action to remap to.
      remapToPulse: string,
      // The value the old action should be set to while the input is reserved
      // by the new action (-1 makes the most sense when remapping to something
      // like an afterburner or sprinting action).
      ghostValue: number,
    },

    // If true, only the mouse and analog sticks are allowed to interface with
    // control.
    isBidirectional?: boolean,
  };
}

export {
  ControlSchema,
};
