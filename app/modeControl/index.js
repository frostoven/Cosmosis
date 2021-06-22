// Misc.
import general from './misc/general';

// UI controllers.
import gameMenu from './uiControllers/gameMenu';

// Player camera controllers.
import shipPilot from './cameraControllers/shipPilot';
import freeCam from './cameraControllers/freeCam';
import godCam from './cameraControllers/godCam';

function initAll() {
  general.init();
  gameMenu.init();
  shipPilot.init();
  freeCam.init();
  godCam.init();
}

export default {
  initAll,
}
