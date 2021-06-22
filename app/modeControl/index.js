import general from './misc/general';
import gameMenu from './uiControllers/gameMenu';

function initAll() {
  general.init();
  gameMenu.init();
}

export default {
  initAll,
}
