import CosmosisPlugin from '../../types/CosmosisPlugin';
import ChangeTracker from 'change-tracker/src';
import { Clock } from 'three';
import Stats from '../../../../hackedlibs/stats/stats.module';

export default class Core {
  public onAnimate: ChangeTracker;
  public onAnimateDone: ChangeTracker;
  public _maxFrameDelta: number;
  public _frameLimitCount: number;
  private _clock: Clock;
  private readonly _stats: any;
  private readonly _rendererHooks: Function[];

  constructor() {
    this.onAnimate = new ChangeTracker();
    this.onAnimateDone = new ChangeTracker();
    this._maxFrameDelta = 0;
    this._frameLimitCount = 0;
    this._rendererHooks = [];

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
      this._frameLimitCount += delta;
      if ((this._frameLimitCount) <= this._maxFrameDelta) {
        return;
      }
      else {
        delta = this._frameLimitCount;
        this._frameLimitCount -= this._maxFrameDelta;
      }
    }

    // TODO: check if level logic needs to go before rendering, or if it's ok
    // to place in onAnimate.

    // Call all renderers.
    const renderers = this._rendererHooks;
    for (let i = 0, len = renderers.length; i < len; i++) {
      renderers[i]();
    }

    // Always place this as early in the animation function as possible,
    // preferably right after the rendering. No game logic should happen before
    // this point.
    this.onAnimate.setValue(delta);

    // No game logic should happen after this point.
    this.onAnimateDone.setValue(delta);

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

export {
  corePlugin,
  CoreType,
}
