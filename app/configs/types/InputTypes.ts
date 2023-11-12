// Dev note: be careful when changing this - ModeController._actionReceivers
// currently hardcodes the numbers used here.
enum InputType {
  none = 0,
  // Standard digital button.
  keyboardButton,
  // These range from 0 to 1 and include all buttons on gamepads and flight
  // sticks.
  analogButton,
  // These range from -1 to 1.
  analogStickAxis,
  // Standard digital button.
  mouseButton,
  // Raw values of any range. Generally used for head-look.
  mouseAxisInfinite,
  // Range from -1 to 1, but gradually returns to 0 byt itself.
  mouseAxisGravity,
  // Range from -1 to 1.
  mouseAxisThreshold,
  // Analog devices that stay in place after moving them (eg. the throttle
  // control on a HOTAS box).
  analogSlider,
  // Up and down scrolling. Note that this is propagated as keyboard input.
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
