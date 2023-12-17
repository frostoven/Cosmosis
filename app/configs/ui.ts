import { InputType } from './types/InputTypes';
import { ScrollName } from './types/MouseButtonName';
import { SemanticICONS } from 'semantic-ui-react';

const keyTypeIcons: { [key: string]: SemanticICONS } = {
  // General
  default: 'dna',
  // By input type
  [InputType.keyboardButton]: 'keyboard',
  [InputType.mouseButton]: 'mouse pointer',
  [InputType.mouseAxisStandard]: 'crosshairs',
  [InputType.mouseAxisThreshold]: 'bullseye',
  [InputType.mouseAxisGravity]: 'bullseye',
  [InputType.gamepadSlider]: 'fighter jet',
  [InputType.gamepadAxisStandard]: 'fighter jet',
  [InputType.gamepadButton]: 'gamepad',
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
