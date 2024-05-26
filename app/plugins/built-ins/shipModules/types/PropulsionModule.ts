import ShipModule from './ShipModule';
import { PropulsionTypeEnum } from './PropulsionTypeEnum';

export default class PropulsionModule extends ShipModule {
  public type: PropulsionTypeEnum = PropulsionTypeEnum.none;

  imposeSelfActivationToggle() {
    console.error(
      `[imposeSelfActivationToggle] '${this.friendlyName}': interface no supported.`,
    );
  }
}
