// TODO: implement me
// https://javascript.info/modules-dynamic-imports

// Note: the only reason this isn't done by default will all parts of the game
// is because it means we can't HMR components, so development takes much
// longer. If you want to add something to plugins, it needs to be transpiled
// as a separate project.
//
// This game's actual components may be pluginified once the game is in an
// actual stable state, where modifying most / all core modules at once for
// basic milestones is no longer part of the workflow. A decision will be made
// once such a state is actually reached.

// Something like:
const plugins = [
  './example-dir/',
];

export default function loadPlugins() {
  // check if is scene, camera, etc. or maybe not - maybe the plugin decides
  // this by itself.
}
