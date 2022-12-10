import CosmosisPlugin from '../../types/CosmosisPlugin';
import { PointerLockControls } from './types/PointerLockControls';
import { gameRuntime } from '../../gameRuntime';
import { LockModes } from './types/LockModes';

// Note: this relates to how the mouse works with the game window. It has
// nothing to do with mounting rodents, though we may or may not have such
// implementation plans.
class MouseDriver extends PointerLockControls {
  private readonly _superLock: Function;

  constructor() {
    const camera = gameRuntime.tracked.player.cachedValue.camera;
    super(camera, document.body);

    const core = gameRuntime.tracked.core.cachedValue;
    core.onAnimateDone.getEveryChange(this.step.bind(this));

    // TODO: on app gain focus, steal escape. On blur, discard escape. This
    //  hopefully allows us to control unintentional ctrl lockouts better.
    //  See issue #91

    this.setLockMode(LockModes.freeLook);

    // Because our base class uses an incompatible methodology, we need to
    // duck-punch our overrides in, 90's style.
    this._superLock = this.lock;
    this.lock = this._lockOverride;

    this.lock();
  }

  // _setupWatchers() {
  //   gameRuntime.tracked.player.getEveryChange((player) => {
  //     this.camera = player.camera;
  //   });
  // }

  _lockOverride() {
    // @ts-ignore TS2304 - it really is real, TS, I promise.
    const sasquatch = nw.Window.get();
    // This acts like a click without actually sending a click event. Allows
    // 'lock' to work in far more cases where the beast would otherwise escape.
    // sasquatch.blur();
    // sasquatch.focus();
    this._superLock();
  };

  step() {
    // this.updateOrientation();
  }
}

const mouseDriverPlugin = new CosmosisPlugin('mouseDriver', MouseDriver);

export {
  MouseDriver,
  mouseDriverPlugin,
}
