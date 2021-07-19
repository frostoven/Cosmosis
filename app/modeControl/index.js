// Misc.
import general from './misc/general';

// UI controllers.
import menuViewer from './reactControllers/menuViewer';

// Player camera controllers.
import shipPilot from './cameraControllers/shipPilot';
import freeCam from './cameraControllers/freeCam';
import godCam from './cameraControllers/godCam';

function initAll() {
  general.init();
  menuViewer.init();
  shipPilot.init();
  freeCam.init();
  godCam.init();
}

export default {
  initAll,
}
