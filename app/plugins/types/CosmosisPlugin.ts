import { gameRuntime } from '../gameRuntime';
import ChangeTracker from 'change-tracker/src';
import {
  OnDependenciesMetFn,
  PluginInterface,
} from '../interfaces/PluginInterface';
import { DependencyStructure } from './PluginHelpers';

export default class CosmosisPlugin extends ChangeTracker implements PluginInterface {
  public TrackedClass: any;
  public knownDependencies: DependencyStructure | null = null;
  private readonly _onDependenciesMet: OnDependenciesMetFn | undefined;

  /**
   * @param trackedName - The name of the plugin. It should be a camelCase
   *  version of the tracked class name.
   * @param TrackedClass - The class that acts as your plugin entry-point.
   * @param [knownDependencies] - Dependencies you know you'll need. This is
   *  optional for plugins taking a more low-level approach.
   * @param [overrides] - TODO: Check if this is still useful.
   */
  constructor(
    trackedName: string,
    TrackedClass: any,
    knownDependencies?: DependencyStructure | null,
    overrides?: PluginInterface | null,
  ) {
    super();
    if (trackedName === 'template') {
      throw '[CosmosisPlugin] Fatal error: you may not call your plugin ' +
      '"template" as this is likely a mistake.';
    }
    if (trackedName.endsWith('Plugin')) {
      throw '[CosmosisPlugin] Please remove "Plugin" from end end of your ' +
      `plugin name (${trackedName}) as adding it is likely an accident. If ` +
      'you disagree, please raise an issue and we\'ll consider changing ' +
      'this rule.';
    }
    if (trackedName) {
      /** @type ChangeTracker */
      gameRuntime.tracked[trackedName] = this;
    }
    else {
      throw 'CosmosisPlugin requires a name with which to track your plugin in game state.';
    }

    if (TrackedClass) {
      this.TrackedClass = TrackedClass;
    }

    if (knownDependencies) {
      this.knownDependencies = knownDependencies;
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
