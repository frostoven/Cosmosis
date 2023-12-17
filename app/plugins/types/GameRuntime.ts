import ChangeTracker from 'change-tracker/src';
import { PluginNames } from './PluginNames';

export default class GameRuntime {
  private readonly _tracked: Record<PluginNames, ChangeTracker>;
  private readonly _untracked: { [key: string]: any };
  private readonly _types: { [key: string]: any };

  // TODO: consider adding gameRuntime.waitFor() option.
  constructor() {
    // @ts-ignore
    this._tracked = {};
    this._untracked = {};
    this._types = {};
  }

  // Contains objects that notify the game about its own reference changes.
  get tracked() {
    return this._tracked;
  }

  set tracked(v) {
    throw 'This value is read-only.';
  }

  // Ideally, plain key-value pairs shared across the game, but may also
  // contain hierarchical key-object pairs.
  get shared() {
    return this._tracked;
  }

  set shared(v) {
    throw 'This value is read-only.';
  }

  // Custom classes created by plugins with the intention of being used by
  // other parts of the engine.
  get types() {
    return this._types
  }

  set types(v) {
    throw 'This value is read-only.';
  }
}

