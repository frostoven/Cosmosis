// Dev note: be careful when changing this - ModeController._actionReceivers
// currently hardcodes the numbers used here.
enum InputType {
  none = 0,
  /**
   * Standard digital button.
   */
  keyboardButton,

  /** These range from 0 to 1 and include all buttons on gamepads and flight
   * sticks.
   */
  gamepadButton,

  /**
   * These range from -1 to 1.
   */
  gamepadAxisStandard,

  /**
   * Analog devices that stay in place after moving them (eg. the throttle
   * control on a HOTAS box).
   * Note: This is an extension of gamepadAxisStandard and should only be used
   * from within ControlSchema.
   */
  gamepadSlider,

  /**
   * Standard digital button.
   */
  mouseButton,

  /**
   * Raw values of any range (i.e. infinite in any direction). Generally used
   * for functions like head-look.
   */
  mouseAxisStandard,

  /**
   * Range from -1 to 1, but gradually returns to 0 by itself.
   * Note: This is an extension of mouseAxisStandard and should only be used
   * from within ControlSchema.
   */
  mouseAxisGravity,

  /**
   * Range from -1 to 1.
   * Note: This is an extension of mouseAxisStandard and should only be used
   * from within ControlSchema.
   */
  mouseAxisThreshold,

  /**
   * Up and down scrolling. Note that this is propagated as keyboard input.
   */
  scrollWheel
}

type InputTypeKeys = keyof typeof InputType;
type InputTypeKeyFields = { [key in InputTypeKeys]?: number }

// Example if we wanted to extend things further:
// interface InterfaceInputTypeExtended extends InputTypeKeyFields {
//   AdditionKey1: number;
//   AdditionKey2: number;
// }

export {
  InputType,
  InputTypeKeyFields,
};
