import _ from 'lodash';
import ChangeTracker from 'change-tracker/src';
import { builtInPluginsEnabled } from '../pluginsEnabled';
import { PluginEntry } from '../interfaces/PluginEntry';
import { TypeReplacements } from '../interfaces/TypeReplacements';
import CosmosisPlugin from './CosmosisPlugin';
import {
  closeBootWindow,
  logBootInfo,
  logBootTitleAndInfo,
} from '../../local/windowLoadListener';

export default class PluginLoader {
  // Used for the DOS-like boot window in the bottom left.
  static bootLogIndex = -1;

  public onLoaded: ChangeTracker;
  public onProgress: ChangeTracker;

  private _communityManifestPath: string;
  private _runIndex: number;
  private readonly _dependenciesLoaded: { [key: string]: boolean };
  // Plugins that reached loading stage but had unmet dependencies.
  private readonly _shovedPlugins: Array<PluginEntry>;
  // Anything stored in here will have its class replaced with something else.
  private readonly _pluginOverrides: TypeReplacements;

  constructor() {
    this._communityManifestPath = './pluginCommunity/pluginsEnabled.json';
    this._runIndex = -1;
    this._dependenciesLoaded = {};
    this._shovedPlugins = [];
    this._pluginOverrides = {};
    this.onLoaded = new ChangeTracker();
    this.onProgress = new ChangeTracker();
  }

  start(onLoaded: Function) {
    if (!onLoaded) {
      throw '[PluginLoader] start needs a callback.';
    }

    logBootInfo('Loading ship module drivers:');
    PluginLoader.bootLogIndex = logBootInfo('◆ Processing...');

    this.onLoaded.getOnce(onLoaded);
    this._doPluginRun(builtInPluginsEnabled, false);
  }

  _doPluginRun(array: Array<PluginEntry>, disallowShoving: boolean) {
    const index = ++this._runIndex;
    if (index >= array.length) {
      // Restart the loop, but process shoved plugins (if any).
      if (!disallowShoving) {
        disallowShoving = true;
        this._runIndex = -1;
        this._doPluginRun(this._shovedPlugins, true);
      }
      else {
        _.each(builtInPluginsEnabled, (plugin: PluginEntry) => {
          _.each(plugin?.optional, (optionalDependency: string) => {
            if (!this._dependenciesLoaded[optionalDependency]) {
              console.warn(`[PluginLoader] Plugin '${plugin.name}' has ` +
                `optional dependency '${optionalDependency}', but it has ` +
                `not been satisfied.`,
              );
            }
          });
        });
        console.log('[PluginLoader] All plugins loaded.');
        this.onLoaded.setValue(true);
        logBootTitleAndInfo('Done', 'All drivers loaded', PluginLoader.bootLogIndex);
        logBootTitleAndInfo('MicroECI Spacecraft OS booted!', '');
        logBootInfo('Handing control over to the helm');
        logBootInfo('Welcome, Commander.');
        setTimeout(() => {
          closeBootWindow();
        }, 2500);
      }
      return;
    }

    // -----------------------------------------------------------------------------
    const {
      name,
      dependencies,
      pluginInstance,
      timeoutWarn = 3000,
    } = array[index];
    // -----------------------------------------------------------------------------
    let dependencyMissing = false;
    let shoved = false;
    if (dependencies?.includes('*')) {
      // This plugin is a wildcard match, meaning it wants to be loaded last.
      if (!disallowShoving) {
        shoved = true;
        this._shovedPlugins.push(array[index]);
        this.onProgress.setValue({ name, loaded: false, shoved: true });
        // console.log(`-> ${name} wants to be loaded last; shoving.`);
      }
    }
    else if (dependencies?.length) {
      for (let di = 0, len = dependencies.length; di < len; di++) {
        const dependency = dependencies[di];
        dependencyMissing = !this._dependenciesLoaded[dependency];
        if (dependencyMissing) {
          if (disallowShoving) {
            console.error(
              '[PluginLoader] Error:', name, 'is could not resolve ' +
              'dependency', dependency, '- either it\'s missing, or you ' +
              'have a circular dependency.',
            );
          }
          else if (!shoved) {
            console.log(`[${name}] Dependency ${dependency} not ready; shoving ${name}.`);
            shoved = true;
            this._shovedPlugins.push(array[index]);
            this.onProgress.setValue({ name, loaded: false, shoved: true });
          }
        }
      }
    }

    // console.log(`---> name=${name}, dependencyMissing=${dependencyMissing}, disallowShoving=${disallowShoving}, shoved=${shoved}`);

    if (!dependencyMissing && !shoved) {
      let plugin: CosmosisPlugin;
      if (pluginInstance) {
        plugin = pluginInstance;
      }
      // @ts-ignore
      else if (window.$earlyPlugin[name]) {
        // Plugin is community-offered.
        // @ts-ignore
        plugin = window.$earlyPlugin[name];
      }
      // @ts-ignore
      else if (window.$latePlugin[name]) {
        // Plugin is community-offered.
        // @ts-ignore
        plugin = window.$latePlugin[name];
      }
      else {
        console.error('[PluginLoader] Error:', name, 'does not appear to have a valid instance registered.');
        setTimeout(() => this._doPluginRun(array, disallowShoving));
        return;
      }

      const pluginOverrides = this._pluginOverrides[name];
      if (pluginOverrides) {
        plugin.TrackedClass = pluginOverrides.replaceClassWith;
      }

      const warnTimer = setTimeout(() => {
        console.warn(`[PluginLoader] Warning: plugin '${name}' has not finished loading after ${timeoutWarn}ms`);
      }, timeoutWarn);

      plugin.onDependenciesMet({
        next: () => {
          clearTimeout(warnTimer);
          this._dependenciesLoaded[name] = true;
          this.onProgress.setValue({ name, loaded: true, shoved: false });
          setTimeout(() => this._doPluginRun(array, disallowShoving));
        },
        replaceClass: ({ pluginName, replaceClassWith }) => {
          this._pluginOverrides[pluginName] = {
            name: pluginName,
            replaceClassWith,
          };
        },
      });
    }
    else if (shoved && !disallowShoving) {
      setTimeout(() => this._doPluginRun(array, disallowShoving));
    }
    else {
      console.error(
        '[PluginLoader] Unhandled plugin', name, '- this is a Cosmosis bug, ' +
        'please report it.',
      );
    }
  }
}
