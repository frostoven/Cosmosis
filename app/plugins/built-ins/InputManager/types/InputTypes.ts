// Dev note: be careful when changing this - ModeController._actionReceivers
// currently hardcodes the numbers used here.
enum InputType {
  none = 0,
  keyboardButton,
  analogButton,
  analogStickAxis,
  mouseButton,
  mouseAxisInfinite,
  mouseAxisGravity,
  mouseAxisThreshold,
}

export {
  InputType,
}
