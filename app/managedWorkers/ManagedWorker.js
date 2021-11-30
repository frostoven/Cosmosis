// Managed web worker with opt-in/out listeners.

import CbQueue from '../local/CbQueue';

export default class ManagedWorker extends Worker {
  constructor(url) {
    super(url, { type: 'module' });
    super.onmessage = this._onInternalMessage;
    this._listeners = {};
  }

  addWorkerListener(message, callback) {
    if (!this._listeners[message]) {
      this._listeners[message] = new CbQueue();
    }
    this._listeners[message].register(callback);
  }

  removeWorkerListener(message, callback) {
    if (!this._listeners[message]) {
      return;
    }
    this._listeners[message].deregister(callback);
  }

  _onInternalMessage(message) {
    const payload = message.data;
    if (this._listeners[payload.key]) {
      this._listeners[payload.key].notifyAll(payload);
    }
  }
}
