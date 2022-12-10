import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';

const freeCamControls: ControlSchema = {
  // Basic controls
  moveForward:  { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyW', 'ArrowUp' ] },
  moveBackward: { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyS', 'ArrowDown' ] },
  moveLeft:     { actionType: ActionType.analogLiteral, current: null, default: [ 'ArrowLeft', 'KeyA' ] },
  moveRight:    { actionType: ActionType.analogLiteral, current: null, default: [ 'ArrowRight', 'KeyD' ] },
  moveUp:       { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyR', 'Space' ] },
  moveDown:     { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyF' ] },
  speedUp:      { actionType: ActionType.analogLiteral, current: null, default: [ 'NumpadAdd' ] },
  speedDown:    { actionType: ActionType.analogLiteral, current: null, default: [ 'NumpadSubtract' ] },
  doubleSpeed:  { actionType: ActionType.analogLiteral, current: null, default: [ 'ShiftLeft', 'ShiftRight' ] },

  // Analog and look-around
  pitchUp:      { actionType: ActionType.analogAdditive, kbAmount: -1000, current: null, default: [ 'spNorth', 'Numpad8' ] },
  pitchDown:    { actionType: ActionType.analogAdditive, kbAmount:  1000, current: null, default: [ 'spSouth', 'Numpad2' ] },
  rollLeft:     { actionType: ActionType.analogLiteral,  kbAmount:  0.01, current: null, default: [ 'Numpad7' ] },
  rollRight:    { actionType: ActionType.analogLiteral,  kbAmount: -0.01, current: null, default: [ 'Numpad9' ] },
  yawLeft:      { actionType: ActionType.analogAdditive, kbAmount: -1000, current: null, default: [ 'spWest', 'Numpad4' ] },
  yawRight:     { actionType: ActionType.analogAdditive, kbAmount:  1000, current: null, default: [ 'spEast', 'Numpad6' ] },

  // Pulsed values
  interact:     { actionType: ActionType.pulse,         current: null, default: [ 'KeyE' ] },

  // Dev controls.
  _devChangeCamMode:   { actionType: ActionType.pulse, current: null, default: [ 'F7', 'F8' ] },
};

export {
  freeCamControls,
};
