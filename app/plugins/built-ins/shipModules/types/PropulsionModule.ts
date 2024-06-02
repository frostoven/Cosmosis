import ShipModule from './ShipModule';
import { PropulsionTypeEnum } from './PropulsionTypeEnum';
import { clamp } from '../../../../local/mathUtils';

export default class PropulsionModule extends ShipModule {
  public type: PropulsionTypeEnum = PropulsionTypeEnum.none;

  // Current throttle in percentage, where 0 is 0% and 1 is 100%.
  protected _throttle = 0;

  imposeSelfActivationToggle() {
    console.error(
      `[imposeSelfActivationToggle] '${this.friendlyName}': interface no supported.`,
    );
  }

  setThrottle(throttle: number) {
    this._throttle = clamp(throttle, -1, 1);
  }
}
