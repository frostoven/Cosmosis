import { builtInPluginsEnabled } from '../pluginsEnabled';
import { PluginEntry } from '../interfaces/PluginEntry';
import { PluginInterface } from '../interfaces/PluginInterface';
import { TypeReplacements } from '../interfaces/TypeReplacements';

export default class PluginLoader {
  private _communityManifestPath: string;
  private _runIndex: number;
  private readonly _dependenciesLoaded: { [key: string]: boolean };
  // Plugins that reached loading stage but had unmet dependencies.
  private readonly _shovedPlugins: Array<PluginEntry>;
  // Anything stored in here will have its class replaced with something else.
  private readonly _typeReplacements: TypeReplacements;

  constructor() {
    this._communityManifestPath = './pluginCommunity/pluginsEnabled.json';
    this._runIndex = -1;
    this._dependenciesLoaded = {};
    this._shovedPlugins = [];
    this._typeReplacements = {};
  }

  start() {
    this.doPluginRun(builtInPluginsEnabled, false);
  }

  doPluginRun(array: Array<PluginEntry>, disableShoving: boolean) {
    const index = ++this._runIndex;
    console.log('[PluginLoader] index:', index, ' array len:', array.length);
    if (index >= array.length) {
      // Restart the loop, but process shoved plugins (if any).
      if (!disableShoving) {
        disableShoving = true;
        this._runIndex = -1;
        this.doPluginRun(this._shovedPlugins, true);
      }
      else {
        console.log('[PluginLoader] All plugins loaded.')
      }
      return;
    }

    const { name, dependencies, type, timeoutWarn = 3000 } = array[index];
    let disallowRun = false;
    let shoved = false;
    if (dependencies) {
      for (let di = 0, len = dependencies.length; di < len; di++) {
        const dependency = dependencies[di];
        const dependencyMissing = !this._dependenciesLoaded[dependency];
        if (dependencyMissing) {
          console.log('----> Missing dependency', dependency);
          disallowRun = true;
          if (disableShoving) {
            console.error('[PluginLoader] Error:', name, 'is missing dependency', dependency);
          }
          else if (!shoved) {
            shoved = true;
            this._shovedPlugins.push(array[index]);
          }
        }
      }
    }

    if (!disallowRun && !shoved) {
      let Type;
      if (this._typeReplacements[name]) {
        Type = this._typeReplacements[name].replaceClassWith;
      }
      else if (type) {
        // Plugin is a built-in.
        Type = type;
      }
      else {
        // Plugin is community-offered.
        // @ts-ignore
        Type = window.$plugin[name];
      }

      if (!Type) {
        console.error('[PluginLoader] Error:', name, 'does not appear to have a valid class registered.');
        setTimeout(() => this.doPluginRun(array, disableShoving));
        return;
      }

      const warnTimer = setTimeout(() => {
        console.warn(`[PluginLoader] Warning: plugin '${name}' has not finished loading after ${timeoutWarn}ms`);
      }, timeoutWarn);

      const plugin: PluginInterface = new Type();
      plugin.onDependenciesMet({
        next: () => {
          clearTimeout(warnTimer);
          this._dependenciesLoaded[name] = true;
          setTimeout(() => this.doPluginRun(array, disableShoving));
        },
        replaceClass: ({ pluginName, replaceClassWith }) => {
          this._typeReplacements[pluginName] = {
            name: pluginName,
            replaceClassWith,
          }
        }
      });
    }
  }
}
