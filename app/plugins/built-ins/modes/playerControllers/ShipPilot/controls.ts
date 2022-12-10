import { ActionType } from '../../../InputManager/types/ActionType';
import { ControlSchema } from '../../../InputManager/interfaces/ControlSchema';

const shipPilotControls: ControlSchema = {
  // Pulsed controls
  thrustUp10:          { actionType: ActionType.pulse, current: null, default: [ 'spScrollUp' ] },
  thrustReset:         { actionType: ActionType.pulse, current: null, default: [ 'spScrollDown' ] },
  toggleMouseSteering: { actionType: ActionType.pulse, current: null, default: [ 'spMouseMiddle', 'Numpad5' ] },
  engageHyperdrive:    { actionType: ActionType.pulse, current: null, default: [ 'KeyJ' ] },
  toggleFlightAssist:  { actionType: ActionType.pulse, current: null, default: [ 'KeyZ' ] },
  cycleInternalLights: { actionType: ActionType.pulse, current: null, default: [ 'Numpad0' ] },
  cycleExternalLights: { actionType: ActionType.pulse, current: null, default: [ 'KeyL' ] },

  // Analog controls
  thrustInc:           { actionType: ActionType.analogAdditive, current: null, default: [ 'KeyW' ] },
  thrustDec:           { actionType: ActionType.analogAdditive, current: null, default: [ 'KeyS' ] },
  pitchUp:             { actionType: ActionType.analogLiteral, current: null, default: [ 'spNorth' ] },
  pitchDown:           { actionType: ActionType.analogLiteral, current: null, default: [ 'spSouth' ] },
  rollLeft:            { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyA' ] },
  rollRight:           { actionType: ActionType.analogLiteral, current: null, default: [ 'KeyD' ] },
  yawLeft:             { actionType: ActionType.analogLiteral, current: null, default: [ 'spWest' ] },
  yawRight:            { actionType: ActionType.analogLiteral, current: null, default: [ 'spEast' ] },

  // Look-around controls
  lookUp:    { actionType: ActionType.analogAdditive, kbAmount: -1000, current: null, default: [ 'spNorth', 'Numpad8' ] },
  lookDown:  { actionType: ActionType.analogAdditive, kbAmount:  1000, current: null, default: [ 'spSouth', 'Numpad2' ] },
  lookLeft:  { actionType: ActionType.analogAdditive, kbAmount: -1000, current: null, default: [ 'spWest', 'Numpad4' ] },
  lookRight: { actionType: ActionType.analogAdditive, kbAmount:  1000, current: null, default: [ 'spEast', 'Numpad6' ] },

  // Dev controls.
  _debugFullWarpSpeed: { actionType: ActionType.pulse, current: null, default: [ 'ScrollLock' ] },
  _devChangeCamMode:   { actionType: ActionType.pulse, current: null, default: [ 'F7', 'F8' ] },
};

export {
  shipPilotControls,
};
