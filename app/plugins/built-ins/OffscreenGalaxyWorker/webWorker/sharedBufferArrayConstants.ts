// -- Misc vars --//

let _index = 0;

const RUNTIME_BRIDGE = 'BridgeRequest';
const SKYBOX_TO_HOST = 'SendSkybox';

const FRONT_SIDE = 1;

// -- Array index info --//

const BUFFER_TYPE = _index++;

const POS_X = _index++;
const POS_Y = _index++;
const POS_Z = _index++;

const ROT_X = _index++;
const ROT_Y = _index++;
const ROT_Z = _index++;
const ROT_W = _index++;

// Shared buffer array length
const SBA_LENGTH = _index;

// -- Buffer type info --//

_index = 0;

const TYPE_INVALID = _index++;
const TYPE_POSITIONAL_DATA = _index++;

// -- Constant exports --//

export {
  RUNTIME_BRIDGE,
  SKYBOX_TO_HOST,
  // ------------------- //
  FRONT_SIDE,
  // ------------------- //
  BUFFER_TYPE,
  POS_X,
  POS_Y,
  POS_Z,
  ROT_X,
  ROT_Y,
  ROT_Z,
  ROT_W,
  SBA_LENGTH,
  // ------------------- //
  TYPE_INVALID,
  TYPE_POSITIONAL_DATA,
}
