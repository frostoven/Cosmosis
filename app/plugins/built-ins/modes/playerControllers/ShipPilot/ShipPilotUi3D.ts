import HudItem from '../../../ui/Hud3D/types/HudItem';
import { HudAlign } from '../../../ui/Hud3D/types/HudAlign';
import HudPage from '../../../ui/Hud3D/types/HudPage';
import { gameRuntime } from '../../../../gameRuntime';
import { Hud3D } from '../../../ui/Hud3D';

export default class ShipPilotUi3D {
  init(state) {
    const throttleUi = new HudItem({
      model: 'ndcTester',
      align: HudAlign.right,
      offsetY: 0.001,
      xRotation: 0.01
    });

    const page = new HudPage('shipPilotUi', [ throttleUi ]);
    gameRuntime.tracked.hud3D.getOnce((hud3d: Hud3D) => {
      hud3d.setScreenPage(page, state._pluginCache.camera);
    });
  }

  updateThrottlePosition() {
    //
  }
}
