import CosmosisPlugin from '../../types/CosmosisPlugin';
import ChangeTracker from 'change-tracker/src';
import { Clock } from 'three';

export default class Core {
  public onAnimate: ChangeTracker;
  private _clock: Clock;

  constructor() {
    this.onAnimate = new ChangeTracker();

    this._clock = new Clock(true);
    this._animate();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    let delta = this._clock.getDelta();
    this.onAnimate.setValue(this._clock.getDelta());
  }
}

const corePlugin = new CosmosisPlugin('core', Core);

export {
  corePlugin,
}
