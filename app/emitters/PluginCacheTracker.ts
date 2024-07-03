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
 * Caches plugin changes. Please avoid tracking changes this way if they change
 * each frame.
 *
 * Example 1:
 * const pluginTracker = new PluginCacheTracker([
 *  'core',
 *  'player',
 * ]);
 *
 * pluginTracker.player.camera  <-- gameRuntime.tracked.player.cached.camera;
 * pluginTracker.getOnce('player', fn)  <-- gameRuntime.tracked.player.getOnce(fn);
 *
 *
 * Example 2:
 * Example 1:
 * const pluginTracker = new PluginTracker([
 *  'core',
 *  'player',
 * ],
 * {
 *   player: { camera: 'cachedCamera' },
 * });
 *
 * pluginTracker.cachedCamera  <-- gameRuntime.tracked.levelScene.cached;
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

      this._function[name as string] = (cached: PluginInstances<T>[keyof T]) => {
        // This gets called on every change.
        pluginCache[name as keyof PluginInstances<T>] = cached;

        const shallowKeyVars = this._shallowTracking?.[name];
        if (shallowKeyVars) {
          _.each(shallowKeyVars, (wantedName, actualName) => {
            // Example: this._cachedCamera = player.camera;
            this.pluginCache[wantedName as keyof PluginInstances<T>] =
              cached[actualName];
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
