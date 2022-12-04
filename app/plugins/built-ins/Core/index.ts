import CosmosisPlugin from '../../types/CosmosisPlugin';
import ChangeTracker from 'change-tracker/src';
import { Clock } from 'three';
import Stats from '../../../../hackedlibs/stats/stats.module';

export default class Core {
  public onAnimate: ChangeTracker;
  public _maxFrameDelta: number;
  public _frameLimitCount: number;
  private _clock: Clock;
  private readonly _stats: any;

  constructor() {
    this.onAnimate = new ChangeTracker();
    this._maxFrameDelta = 0;
    this._frameLimitCount = 0;

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
    requestAnimationFrame(() => this._animate());
    let delta = this._clock.getDelta();
    this.onAnimate.setValue(this._clock.getDelta());

    // console.log(this._clock.getElapsedTime());

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

    this._stats.update();
  }

  appendRenderer() {
    //
  }

  prependRenderer() {
    //
  }
}

const corePlugin = new CosmosisPlugin('core', Core);

export {
  corePlugin,
}
