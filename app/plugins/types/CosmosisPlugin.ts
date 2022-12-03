import ChangeTracker from 'change-tracker/src';
import {
  OnDependenciesMetFn,
  PluginInterface,
} from '../interfaces/PluginInterface';
import { preparePlugin } from '../index';

export default class CosmosisPlugin extends ChangeTracker implements PluginInterface {
  public tracker: ChangeTracker;
  public TrackedClass: any;
  private readonly _onDependenciesMet: OnDependenciesMetFn | undefined;

  constructor(trackedName: string, TrackedClass: any, overrides?: PluginInterface) {
    super();
    if (trackedName) {
      this.tracker = preparePlugin(trackedName);
    }
    else {
      throw 'CosmosisPlugin requires a name with which to track your plugin.';
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
