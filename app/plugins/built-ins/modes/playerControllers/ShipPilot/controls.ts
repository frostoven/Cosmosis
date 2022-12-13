import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';

const shipPilotControls: ControlSchema = {
  // Pulsed controls
  thrustUp10:          { actionType: ActionType.pulse, current: null, default: [ 'spScrollUp' ] },
  thrustReset:         { actionType: ActionType.pulse, current: null, default: [ 'spScrollDown' ] },
  toggleMouseSteering: { actionType: ActionType.pulse, current: null, default: [ 'spMouseMiddle', 'Numpad5' ] },
  engageHyperdrive:    { actionType: ActionType.pulse, current: null, default: [ 'KeyJ' ] },
  toggleFlightAssist:  { actionType: ActionType.pulse, current: null, default: [ 'KeyZ' ] },

  // Analog controls
  thrustInc:           { actionType: ActionType.analogAdditive, current: null, default: [ 'KeyW' ] },
  thrustDec:           { actionType: ActionType.analogAdditive, current: null, default: [ 'KeyS' ] },
  // TODO: see if we can create a hybrid mode that additive during free-look, but literal during lock.
  //  Alternatively, we'll need shipPilot to override action types directly as changes happen.
  pitchUp:             { actionType: ActionType.analogAdditive, kbAmount: -1000, current: null, default: [ 'spNorth', 'Numpad8' ] },
  pitchDown:           { actionType: ActionType.analogAdditive, kbAmount:  1000, current: null, default: [ 'spSouth', 'Numpad2' ] },
  rollLeft:            { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyA' ] },
  rollRight:           { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyD' ] },
  yawLeft:             { actionType: ActionType.analogAdditive, kbAmount: -1000, current: null, default: [ 'spWest', 'Numpad4' ] },
  yawRight:            { actionType: ActionType.analogAdditive, kbAmount:  1000, current: null, default: [ 'spEast', 'Numpad6'  ] },

  // Dev controls.
  _debugFullWarpSpeed: { actionType: ActionType.pulse, current: null, default: [ 'ScrollLock' ] },
  _devChangeCamMode:   { actionType: ActionType.pulse, current: null, default: [ 'F7', 'F8' ] },
};

export {
  shipPilotControls,
};
