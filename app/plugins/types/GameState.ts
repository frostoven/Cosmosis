import ChangeTracker from '../../emitters/ChangeTracker';

export default class GameState {
  private readonly _tracked: { [key: string]: ChangeTracker };
  private readonly _untracked: { [key: string]: any };

  constructor() {
    this._tracked = {};
    this._untracked = {};
  }

  get tracked() {
    return this._tracked;
  }

  set tracked(v) {
    throw 'This value is read-only.';
  }

  get shared() {
    return this._tracked;
  }

  set shared(v) {
    throw 'This value is read-only.';
  }
}

