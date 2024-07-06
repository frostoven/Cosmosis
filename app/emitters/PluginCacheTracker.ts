import _ from 'lodash';
import { gameRuntime } from '../plugins/gameRuntime';
import ChangeTracker from 'change-tracker/src';

// Represents individual plugin instances. We use any here as modders can use
// pretty much anything as a plugin, and does not actually hurt type-assistance
// in the manner it's implemented.
type PluginBase = { new(): any };

// Represents a collection of instantiated plugin dependencies.
type PluginInstances<T extends { [key: string]: PluginBase }> = {
  [K in keyof T]: InstanceType<T[K]>;
};

/**
 * Caches plugin changes.
 *
 * Please ensure your plugins are fully initialized before stepping frames.
 * This can be done by correctly relaying your plugin dependencies to the
 * plugin loader, or using onAllPluginsLoaded et al. to track completion.
 *
 * Be aware that some plugins use deferred methods in their constructors which
 * delay their initialization; it's your responsibility to ensure you read the
 * code your plugin interacts with and that you understand its flow.
 *
 * You'll want to match the naming used in the below examples very closely.
 * Whilst it's not mandatory, things get very confusing fast otherwise. It's
 * particularly important that your plugin class not contain the word plugin,
 * otherwise your might end up with inferred names like myPluginPlugin.
 *
 * Something to note is that the below structure is not the only correct one;
 * the Cosmosis plugin system allows pretty much anything you can think of, but
 * you should avoid deviating unless your vision is really hampered by this
 * structure.
 *
 * @example
 * // ========================================================================= //
 *
 * // Example 1 - Template you'll want to use for most new plugins.
 *
 * // -- ✀ Plugin boilerplate ----------------------------------------------------
 *
 * const pluginDependencies = {
 *   core: Core,
 *   player: Player,
 * };
 * const pluginList = Object.keys(pluginDependencies);
 * type Dependencies = typeof pluginDependencies;
 *
 * // -- ✀ -----------------------------------------------------------------------
 *
 * class ExampleTemplate {
 *   private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
 *
 *   someClassMethod() {
 *     this.pluginCache.player.camera // <-- this will auto-complete if you have a decent IDE
 *   }
 * }
 *
 * const exampleTemplatePlugin = new CosmosisPlugin(
 *   'exampleTemplate', ExampleTemplate, pluginDependencies,
 * );
 *
 * export {
 *   ExampleTemplate,
 *   exampleTemplatePlugin,
 * };
 *
 * // ========================================================================= //
 *
 * // Example 2 - Shallow tracking
 * // If you reference a plugin property very often, you can alias it for faster
 * // access. Here we alias the player camera.
 *
 * // -- ✀ Plugin boilerplate ----------------------------------------------------
 *
 * const pluginDependencies = {
 *   player: Player,
 *   inputManager: InputManager,
 *   levelScene: LevelScene,
 * };
 * const shallowTracking = { player: { camera: 'camera' } };
 * const pluginList = Object.keys(pluginDependencies);
 * type Dependencies = typeof pluginDependencies & {
 *   camera: Camera, // declare shallow-tracked aliases
 * };
 *
 * // -- ✀ -----------------------------------------------------------------------
 *
 * class ExampleTemplate {
 *   private _pluginCache = new PluginCacheTracker<Dependencies>(
 *     pluginList, shallowTracking,
 *   ).pluginCache;
 *
 *   someClassMethod() {
 *     this.pluginCache.camera // <-- this will auto-complete if you have a decent IDE
 *   }
 * }
 *
 * const exampleTemplatePlugin = new CosmosisPlugin(
 *   'exampleTemplate', ExampleTemplate, pluginDependencies,
 * );
 *
 * export {
 *   ExampleTemplate,
 *   exampleTemplatePlugin,
 * };
 *
 * // ========================================================================= //
 */
export default class PluginCacheTracker<T extends { [key: string]: any }> {
  public pluginCache: PluginInstances<T> & { tracker: PluginCacheTracker<T> };

  public readonly onAllPluginsLoaded: ChangeTracker;
  private pluginsLoaded: number;
  private readonly pluginCount: number;
  private readonly _function: {};
  private readonly _shallowTracking: {};

  constructor(pluginsToTrack: Array<string>, shallowTracking: {} = {}) {
    this.pluginsLoaded = 0;
    this.pluginCount = pluginsToTrack.length;
    this.onAllPluginsLoaded = new ChangeTracker();
    this.pluginCache = {
      tracker: this,
    } as unknown as T & { tracker: PluginCacheTracker<T> };

    this._function = {};
    this._shallowTracking = shallowTracking;

    const pluginCache = this.pluginCache as any;
    for (let i = 0, len = pluginsToTrack.length; i < len; i++) {
      const name = pluginsToTrack[i];
      pluginCache[name] = gameRuntime.tracked[name];

      this._function[name] = (cached: PluginInstances<T>[keyof T]) => {
        // This gets called on every change.
        pluginCache[name] = cached;

        const shallowKeyVars = this._shallowTracking?.[name];
        if (shallowKeyVars) {
          _.each(shallowKeyVars, (wantedName, actualName) => {
            const value = cached[actualName];
            if (value !== Object(value)) {
              console.error(
                'Shallow tracking does not support primitives, please only ' +
                'use objects. Your value will soon be stale.',
                'Culprit:', actualName, '===', value,
              );
            }
            // Example: this._cachedCamera = player.camera;
            this.pluginCache[wantedName as keyof PluginInstances<T>] = value;
          });
        }
      };

      gameRuntime.tracked[name].getEveryChange(this._function[name]);

      // Used to keep track of whether or not we're still waiting for some
      // plugins to load.
      gameRuntime.tracked[name].getOnce(() => {
        this.pluginsLoaded++;

        if (this.pluginsLoaded === this.pluginCount) {
          this.onAllPluginsLoaded.setValue(this.pluginCount);
        }
      });
    }
  }

  get allPluginsLoaded() {
    if (this.pluginsLoaded === this.pluginCount) {
      return true;
    }
    else if (this.pluginsLoaded > this.pluginCount) {
      console.warn(
        '[PluginTracker] pluginsLoaded > pluginCount ' +
        `(${this.pluginsLoaded} > ${this.pluginCount}). ` +
        'This is a bug. Please investigate.',
      );
      return true;
    }
    else {
      return false;
    }
  }

  remove(names: Array<string> | string) {
    if (typeof names === 'string') {
      names = [ names ];
    }

    for (let i = 0, len = names.length; i < len; i++) {
      const name = names[i];
      gameRuntime.tracked[name].removeGetEveryChangeListener(
        this._function[name],
      );
    }
  }
}

// For debugging:
// @ts-ignore
window.$PluginTracker = PluginCacheTracker;
