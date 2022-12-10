import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';

const freeCamControls: ControlSchema = {
  moveForward:  { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyW', 'ArrowUp' ] },
  moveBackward: { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyS', 'ArrowDown' ] },
  moveLeft:     { actionType: ActionType.analogLiteral, current: null, default: [ 'ArrowLeft', 'KeyA' ] },
  moveRight:    { actionType: ActionType.analogLiteral, current: null, default: [ 'ArrowRight', 'KeyD' ] },
  moveUp:       { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyR', 'Space' ] },
  moveDown:     { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyF' ] },
  turnLeft:     { actionType: ActionType.analogLiteral, current: null, default: [ 'Numpad4' ] },
  turnRight:    { actionType: ActionType.analogLiteral, current: null, default: [ 'Numpad6' ] },
  lookUp:       { actionType: ActionType.analogLiteral, current: null, default: [ 'Numpad8' ] },
  lookDown:     { actionType: ActionType.analogLiteral, current: null, default: [ 'Numpad2' ] },
  rollLeft:     { actionType: ActionType.analogLiteral, current: null, default: [ 'Numpad7' ] },
  rollRight:    { actionType: ActionType.analogLiteral, current: null, default: [ 'Numpad9' ] },
  speedUp:      { actionType: ActionType.analogLiteral, current: null, default: [ 'NumpadAdd' ] },
  speedDown:    { actionType: ActionType.analogLiteral, current: null, default: [ 'NumpadSubtract' ] },
  doubleSpeed:  { actionType: ActionType.analogLiteral, current: null, default: [ 'ShiftLeft', 'ShiftRight' ] },
  pitchUp:      { actionType: ActionType.analogLiteral, current: null, default: [ 'spNorth' ] },
  pitchDown:    { actionType: ActionType.analogLiteral, current: null, default: [ 'spSouth' ] },
  yawLeft:      { actionType: ActionType.analogLiteral, current: null, default: [ 'spWest' ] },
  yawRight:     { actionType: ActionType.analogLiteral, current: null, default: [ 'spEast' ] },
  interact:     { actionType: ActionType.pulse,         current: null, default: [ 'KeyE' ] },
  // Dev controls.
  _devChangeCamMode:   { actionType: ActionType.pulse, current: null, default: [ 'F7', 'F8' ] },
};

export {
  freeCamControls,
};
