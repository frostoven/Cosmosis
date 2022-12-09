import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';

const freeCamControls: ControlSchema = {
  moveForward:  { actionType: ActionType.binary, current: null, default: [ 'KeyW' ] },
  moveBackward: { actionType: ActionType.binary, current: null, default: [ 'ArrowUp' ] },
  moveLeft:     { actionType: ActionType.binary, current: null, default: [ 'KeyS' ] },
  moveRight:    { actionType: ActionType.binary, current: null, default: [ 'ArrowDown' ] },
  moveUp:       { actionType: ActionType.binary, current: null, default: [ 'Numpad7' ] },
  moveDown:     { actionType: ActionType.binary, current: null, default: [ 'ArrowLeft' ] },
  turnLeft:     { actionType: ActionType.binary, current: null, default: [ 'Numpad9' ] },
  turnRight:    { actionType: ActionType.binary, current: null, default: [ 'ArrowRight' ] },
  lookUp:       { actionType: ActionType.binary, current: null, default: [ 'KeyR' ] },
  lookDown:     { actionType: ActionType.binary, current: null, default: [ 'Space' ] },
  rollLeft:     { actionType: ActionType.binary, current: null, default: [ 'KeyF' ] },
  rollRight:    { actionType: ActionType.binary, current: null, default: [ 'KeyA', 'KeyB' ] },
  speedUp:      { actionType: ActionType.binary, current: null, default: [ 'KeyD' ] },
  speedDown:    { actionType: ActionType.binary, current: null, default: [ 'NumpadAdd' ] },
  doubleSpeed:  { actionType: ActionType.binary, current: null, default: [ 'NumpadSubtract' ] },
  interact:     { actionType: ActionType.binary, current: null, default: [ 'ShiftLeft' ] },
  pitchUp:      { actionType: ActionType.binary, current: null, default: [ 'ShiftRight' ] },
  pitchDown:    { actionType: ActionType.binary, current: null, default: [ 'KeyE' ] },
  yawLeft:      { actionType: ActionType.binary, current: null, default: [ 'Numpad4' ] },
  yawRight:     { actionType: ActionType.binary, current: null, default: [ 'Numpad6' ] },
};

export {
  freeCamControls,
};
