import CosmosisPlugin from '../../types/CosmosisPlugin';
import ChangeTracker from 'change-tracker/src';
import { Clock } from 'three';
import Stats from '../../../../hackedlibs/stats/stats.module';

// Note to modders: this object is never recreated, meaning you can use it as
// a quick-n-dirty way to patch data into any per-frame function. An example of
// how you may patch the object is as follows:
// core.onAnimate.getOnce(animationData => { animationData.__myField = 'Yo'; });
// Please always put 2 underscores in front of your variable to prevent
// clashing with built-in functions (built-ins never place 2 underscored in
// front of any var names, making your patch somewhat safe).
const animationData = { delta: 0, bigDelta: 0 };

export default class Core {
  /**
   * The unified view is meant as a friendly place that all modules may report
   * their significant values. For example, ship speed is ship speed regardless
   * of what manages it, so whatever manages it may choose to store is here as
   * shipSpeed. Note that these values should not be altered by code that don't
   * own those values, as they are ignored by the actual owners. For example,
   * setting ship speed to something else won't change the physical systems
   * governing ship speed - the value here is effectively read-only, but
   * updated each frame. That why it's called the unified "view" - it's just a
   * high-level view into game state.
   *
   * The reason this object exists is for easy stat lookups without needing to
   * explicitly hook into dependencies. For example, this allows the user to
   * manually hook custom values into custom UIs without writing any code.
   *
   * This object is currently used internally by the visor HUD to read ship
   * stats such as throttle, walking speed, etc.
   */
  static unifiedView = {
    gameClock: 0,
    helm: {
      throttlePosition: 0,
      throttlePrettyPosition: 0,
    },
    propulsion: {
      canReverse: true,
    }
  };

  public onPreAnimate: ChangeTracker;
  public onAnimate: ChangeTracker;
  public onAnimateDone: ChangeTracker;
  public _maxFrameDelta: number;
  public _frameLimitCount: number;
  private _clock: Clock;
  private readonly _stats: any;
  private readonly _rendererHooks: Function[];
  private animationData: { delta: number; bigDelta: number };

  constructor() {
    // Do not place game logic in pre-animate. It's meant for setup used by
    // onAnimate.
    this.onPreAnimate = new ChangeTracker();
    // Most game logic should go in here.
    this.onAnimate = new ChangeTracker();
    // Stuff that should happen after game logic resolution for this frame.
    this.onAnimateDone = new ChangeTracker();

    this._maxFrameDelta = 0;
    this._frameLimitCount = 0;
    this._rendererHooks = [];
    this.animationData = animationData;

    // @ts-ignore
    this._stats = new Stats();
    document.body.append(this._stats.dom);

    this._clock = new Clock(true);
    this._animate();
  }

  get maxFramerate() {
    return 1000 / this._maxFrameDelta / 1000;
  }

  set maxFramerate(framesPerSecond) {
    if (framesPerSecond <= 0) {
      this._maxFrameDelta = 0;
    }
    else {
      this._maxFrameDelta = 1000 / framesPerSecond / 1000;
    }
  }

  _animate() {
    requestAnimationFrame(this._animate.bind(this));
    let delta = this._clock.getDelta();

    // Used for custom framerate control.
    if (this._maxFrameDelta) {
      // TODO: this method increases cpu by 20% on my system (though it
      //  eliminates stuttering and frame inaccuracy that setTimeout tends to
      //  cause) Perhaps make a dynamic system where setTimout delay only
      //  50%-75% of all frames. Which a bit of luck we can achieve a
      //  stutterless hybrid that doesn't increase CPU usage.
      // TODO: until the previous point is resolved, add note in menu that
      //  manual frame control increases CPU temperature and that
      //  system-managed is the most optimal.
      this._frameLimitCount += delta;
      if ((this._frameLimitCount) <= this._maxFrameDelta) {
        return;
      }
      else {
        delta = this._frameLimitCount;
        this._frameLimitCount -= this._maxFrameDelta;
      }
    }

    // For situations where we want numbers to remain intuitive instead of
    // varying wildly (i.e. close to non-delta'd) if we forgot to apply delta
    // during initial design. bigDelta is 1 at 120Hz, 2 at 60Hz, and 4 at 30Hz.
    const bigDelta = delta * 120;

    // The animationData object is sent to all per-frame functions each frame.
    animationData.delta = delta;
    animationData.bigDelta = bigDelta;
    Core.unifiedView.gameClock += delta;

    // TODO: check if level logic needs to go before rendering, or if it's ok
    // to place in onAnimate.

    // Call all renderers.
    const renderers = this._rendererHooks;
    for (let i = 0, len = renderers.length; i < len; i++) {
      renderers[i]();
    }

    // Anything that should happen before core game logic goes here.
    this.onPreAnimate.setValue(animationData);

    // Always place this as early in the animation function as possible,
    // preferably right after the rendering. No game logic should happen before
    // this point.
    this.onAnimate.setValue(animationData);

    // No game logic should happen after this point.
    this.onAnimateDone.setValue(animationData);

    // Update the FPS and latency meter.
    this._stats.update();
  }

  prependRendererHook(callback: Function) {
    this._rendererHooks.unshift(callback);
  }

  appendRenderHook(callback: Function) {
    this._rendererHooks.push(callback);
  }
}

const corePlugin = new CosmosisPlugin('core', Core);
interface CoreType extends Core{}

// Debugging:
// @ts-ignore
window.$unifiedView = Core.unifiedView;

export {
  corePlugin,
  CoreType,
}
