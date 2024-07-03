import { PluginNames } from './PluginNames';

/**
 * The signature used for plugin dependency objects.
 */
type DependencyStructure = { [externalPlugin: string]: any };

/**
 * Warning: This aids in plugin auto-discover completion, but destroys plugin
 * cache completion (the latter of which is far more important).
 * TODO: Find a fix for this issue.
 *
 * Assists developers in getting auto-completion assistance for auto-discovered
 * plugins.
 *
 * Note that it's not an error to write a name of a plugin that does not exist.
 * This is because the nature of modding makes it possible for modders to
 * target plugins they *anticipate* will exist.
 */
type KnownInstalledPlugins =
  ({ [pluginName in PluginNames]? } |
  { [unknownPlugin: string]: any }) ;

export {
  DependencyStructure,
  KnownInstalledPlugins,
};
