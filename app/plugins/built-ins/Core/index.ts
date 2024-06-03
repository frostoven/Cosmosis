import CosmosisPlugin from '../../types/CosmosisPlugin';
import ChangeTracker from 'change-tracker/src';
import Stats from '../../../../hackedlibs/stats/stats.module';
import { lerp } from '../../../local/mathUtils';

/**
 * The animationData object is sent to all per-frame functions each frame.
 *
 * Note to modders: the animationData object is never recreated, meaning you
 * can use it as a quick-n-dirty way to patch data into any per-frame function.
 * An example of how you may patch the object is as follows:
 * core.onAnimate.getOnce(animationData => { animationData.__myField = 'Yo'; });
 * Please always put 2 underscores in front of your variable to prevent
 * clashing with built-in functions (built-ins never place 2 underscored in
 * front of any var names, making your patch somewhat safe).
 */
const animationData = {
  delta: 0,
  // We multiply by 5 a lot in this game, so we have a premultiplied
  // convenience var for it here.
  bigDelta: 0,
  // For situations where we want numbers to remain intuitive instead of
  // varying wildly (i.e. close to non-delta'd) if we forgot to apply delta
  // during initial design. bigDelta is 1 at 120Hz, 2 at 60Hz, and 4 at 30Hz.
  hugeDelta: 0,
  // Interpolates between the previous and next frame. Can ease jitter in
  // visually-critical sections, but hurts accuracy during sudden frame drops.
  smoothDelta: 1,
  // This engine supports running the CPU and GPU at different frame rates.
  // This value is the delta for GFX-related work.
  gpuDelta: 0,
};

// TODO: Import package.json. Check if frame throttling is enabled. If yes, set
//  experimentalFrameControl to true, which supports the below. Else, if false,
//  just do a regular requestAnimationFrame.

// We use setTimeout to throttle between requestAnimationFrame calls, so this
// isn't entirely accurate as setTimeout has a lowest wait time of 4ms.
const logicFpsTarget = 225; // 120; // 65; // 45;
const gfxFpsTarget = 225; // 120; // 65; // 45;
const idealLogicFrameDelay = 1000 / logicFpsTarget;
const idealGfxFrameDelay = 1000 / gfxFpsTarget;
const syncLogicAndGfx = true;
let lastLogicRender = 0;
let lastGfxRender = 0;
let triggerGfxRender = false;

export default class Core {
  /**
   * The unified view is meant as a friendly place that all modules may report
   * their significant values. Specifically, this is for *high-level* read-only
   * values, set only by modules that own them. For example, ship speed is ship
   * speed regardless of what manages it, so whatever manages it may choose to
   * store is here as shipSpeed. Note that these values should not be altered
   * by code that don't own those values, as changes are almost always ignored
   * by the actual owners. For example, setting ship speed to something else
   * won't change the physical systems governing ship speed. That why it's
   * called the unified "view" - it's just a high-level view into game state.
   *
   * The reason this object exists is for easy stat lookups without needing to
   * explicitly hook into dependencies. For example, this allows the user to
   * manually hook custom values into custom UIs without writing any code.
   *
   * The unified view may be seen as the Cosmosis ship specification and ship
   * kernel output.
   */
  static unifiedView = {
    gameClock: 0,
    custom: {
      example1166877: 'Community modding area.',
    },
    // Represents controls as per instructions from the pilot's controls.
    helm: {
      // If true, ship will automatically try to stop rotation when the thrusters
      // aren't active.
      flightAssist: true,
      // The requested throttle position (whether by pilot or hardware driver).
      throttlePosition: 0,
      // Slightly lags behind throttlePosition. Used to make visuals smoother.
      throttlePrettyPosition: 0,
      // Nose up/down angle.
      pitch: 0,
      // How close the wings are to horizontal.
      roll: 0,
      // Nose left/right angle.
      yaw: 0,
    },
    // Represents the current state of the active propulsion system.
    propulsion: {
      // If true, the active engine can reverse.
      canReverse: true,
      currentSpeedLy: 0,
      // How close the engine is to max speed, where 0 is idle and 1 is max
      // speed.
      outputLevel: 0,
      // A slightly less accurate version of outputLevel. Exists to smooth out
      // rapid fluctuations to the frame delta. Used by the HUD.
      outputLevelPretty: 0,
    }
  };

  static animationData: {
    delta: number; bigDelta: number, smoothDelta: number, gpuDelta: number,
  } = animationData;

  public onPreAnimate: ChangeTracker;
  public onAnimate: ChangeTracker;
  public onAnimateDone: ChangeTracker;
  private readonly _stats: any;
  private readonly _rendererHooks: Function[];

  constructor() {
    // Do not place game logic in pre-animate. It's meant for setup used by
    // onAnimate.
    this.onPreAnimate = new ChangeTracker();
    // Most game logic should go in here.
    this.onAnimate = new ChangeTracker();
    // Stuff that should happen after game logic resolution for this frame.
    this.onAnimateDone = new ChangeTracker();
    // Graphical renderers are stored here.
    this._rendererHooks = [];

    // @ts-ignore
    this._stats = new Stats();
    document.body.append(this._stats.dom);
    this._renderIfNeeded(0);
  }

  _updateCpuDeltas(delta: number) {
    animationData.delta = delta;
    animationData.bigDelta = delta * 5;
    animationData.hugeDelta = delta * 120;
    animationData.smoothDelta = lerp(animationData.smoothDelta, delta, 0.5);
  }

  _updateGfxDeltas(delta: number) {
    animationData.gpuDelta = delta;
  }

  _animateGfx = () => {
    // Call all renderers.
    const renderers = this._rendererHooks;
    for (let i = 0, len = renderers.length; i < len; i++) {
      renderers[i]();
    }
  };

  _animateLogic = () => {
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
  };

  prependRendererHook(callback: Function) {
    this._rendererHooks.unshift(callback);
  }

  appendRenderHook(callback: Function) {
    this._rendererHooks.push(callback);
  }

  // Renders the scene if a sufficient amount of time has passed.
  _renderIfNeeded = (timestamp: number = 0.1) => {
    let gfxDelta = timestamp - lastGfxRender;
    let logicDelta = timestamp - lastLogicRender;
    Core.unifiedView.gameClock += logicDelta;

    if (syncLogicAndGfx || gfxDelta >= idealGfxFrameDelay) {
      triggerGfxRender = true;
    }

    if (logicDelta >= idealLogicFrameDelay) {
      // We're lagging, or have met our target. Animate.
      requestAnimationFrame(this._renderIfNeeded);
      lastLogicRender = timestamp;
      this._updateCpuDeltas(logicDelta * 0.01);
      this._animateLogic();

      if (triggerGfxRender) {
        triggerGfxRender = false;
        lastGfxRender = timestamp;
        this._updateGfxDeltas(gfxDelta * 0.01);
        this._animateGfx();
      }
    }
    else {
      const delay = (idealLogicFrameDelay - logicDelta);
      setTimeout(() => {
        requestAnimationFrame(this._renderIfNeeded);
      }, delay);
    }
  };
}

// --- Debug - Jank Detection ---------------------------------------------- //
function measureJank(threshold = 23) {
  let lastFrameTime = performance.now();
  (function checkJank() {
    const currentFrameTime = performance.now();
    const frameDuration = currentFrameTime - lastFrameTime;

    if (frameDuration > threshold) {
      console.log(`Jank detected! Frame took ${frameDuration.toFixed(2)}ms`);
    }

    lastFrameTime = currentFrameTime;
    requestAnimationFrame(checkJank);
  })();
}

// @ts-ignore
window.measureJank = measureJank;
// ------------------------------------------------------------------------- //

const corePlugin = new CosmosisPlugin('core', Core);

interface CoreType extends Core {
}

// Debugging:
// @ts-ignore
window.$unifiedView = Core.unifiedView;

export {
  corePlugin,
  CoreType,
};
