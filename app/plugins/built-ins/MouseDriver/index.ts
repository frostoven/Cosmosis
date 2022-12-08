import CosmosisPlugin from '../../types/CosmosisPlugin';
import { PointerLockControls } from './types/PointerLockControls';
import { gameRuntime } from '../../gameRuntime';
import { LockModes } from './types/LockModes';

// Note: this relates to how the mouse works with the game window. It has
// nothing to do with mounting rodents, though we may or may not have such
// implementation plans.
class MouseDriver extends PointerLockControls {
  constructor() {
    const camera = gameRuntime.tracked.player.cachedValue.camera;
    super(camera, document.body);

    const core = gameRuntime.tracked.core.cachedValue;
    core.onAnimateDone.getEveryChange(this.step.bind(this));

    // this.setLockMode(LockModes.freeLook);
    this.lock();
  }

  // @ts-ignore TS2425 - It doesn't like overriding member properties with
  // member functions, but IMO this override is logical (because they're both
  // functions). We can definitely look at refactoring PointerLockControls,
  // though.
  lock() {
    // @ts-ignore TS2304 - it really is real, TS, I promise.
    const sasquatch = nw.Window.get();
    // This acts like a click without actually sending a click event. Allows
    // 'lock' to work in far more cases where the beast would otherwise escape.
    sasquatch.focus();
    super.lock();
  };

  step() {
    this.updateOrientation();
  }
}

const mouseDriverPlugin = new CosmosisPlugin('mouseDriver', MouseDriver);

export {
  MouseDriver,
  mouseDriverPlugin,
}
