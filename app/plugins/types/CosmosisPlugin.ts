import { gameState } from '../gameState';
import ChangeTracker from 'change-tracker/src';
import {
  OnDependenciesMetFn,
  PluginInterface,
} from '../interfaces/PluginInterface';

export default class CosmosisPlugin extends ChangeTracker implements PluginInterface {
  public TrackedClass: any;
  private readonly _onDependenciesMet: OnDependenciesMetFn | undefined;

  constructor(trackedName: string, TrackedClass: any, overrides?: PluginInterface) {
    super();
    if (trackedName) {
      /** @type ChangeTracker */
      gameState.tracked[trackedName] = this;
    }
    else {
      throw 'CosmosisPlugin requires a name with which to track your plugin in game state.';
    }

    if (TrackedClass) {
      this.TrackedClass = TrackedClass;
    }

    const onDependenciesMet = overrides?.onDependenciesMet;
    if (onDependenciesMet) {
      this._onDependenciesMet = onDependenciesMet;
    }
  }

  onDependenciesMet: OnDependenciesMetFn = (modInterface) => {
    if (this._onDependenciesMet) {
      this._onDependenciesMet(modInterface);
    }
    else {
      this.setValue(new this.TrackedClass());
      modInterface.next();
    }
  };

  // recreate: () => {},
}
