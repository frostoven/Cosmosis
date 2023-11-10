import { InputType } from './types/InputTypes';

const keyTypeIcons = {
  default: 'dna',
  [InputType.keyboardButton]: 'keyboard',
  [InputType.mouseButton]: 'mouse pointer',
  [InputType.mouseAxisInfinite]: 'crosshairs',
  [InputType.mouseAxisThreshold]: 'bullseye',
  [InputType.mouseAxisGravity]: 'bullseye',
  [InputType.analogSlider]: 'fighter jet',
  [InputType.analogStickAxis]: 'fighter jet',
  [InputType.analogButton]: 'gamepad',
};

export {
  keyTypeIcons,
}
