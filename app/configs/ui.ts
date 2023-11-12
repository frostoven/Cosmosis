import { InputType } from './types/InputTypes';
import { ScrollName } from './types/MouseButtonName';
import { SemanticICONS } from 'semantic-ui-react';

const keyTypeIcons: { [key: string]: SemanticICONS } = {
  // General
  default: 'dna',
  // By input type
  [InputType.keyboardButton]: 'keyboard',
  [InputType.mouseButton]: 'mouse pointer',
  [InputType.mouseAxisInfinite]: 'crosshairs',
  [InputType.mouseAxisThreshold]: 'bullseye',
  [InputType.mouseAxisGravity]: 'bullseye',
  [InputType.analogSlider]: 'fighter jet',
  [InputType.analogStickAxis]: 'fighter jet',
  [InputType.analogButton]: 'gamepad',
  // By action name
  [ScrollName.spScrollUp]: 'sort amount up',
  [ScrollName.spScrollDown]: 'sort amount down',
  [ScrollName.spScrollLeft]: 'text width',
  [ScrollName.spScrollRight]: 'text width',
  // Axes
  MouseX: 'arrows alternate horizontal',
  MouseY: 'arrows alternate vertical',
};

export {
  keyTypeIcons,
}
