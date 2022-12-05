/**
 * Simple prototype for handling registering and deregistering of pretty much
 * anything, although specifically made to deduplicate callback boilerplate.
 * <br><br>
 * * Note: This has been superseded by the ChangeTracker class.
 * @constructor
 * @deprecated
 */
export default function CbQueue() {
  this.listeners = [];
}

/**
 * Registers a listener that will be called if a change occurs.
 * @param {any} cb - Callback or object being registered.
 */
CbQueue.prototype.register = function registerListener(cb) {
  this.listeners.push(cb);
};

/**
 * Removes a previously registered function. Requires a reference to the same
 * function that was used in registerListener.
 * @param {any} cb - Callback or object being deregistered.
 * @returns {boolean}
 */
CbQueue.prototype.deregister = function deregisterListener(cb) {
  for (let i = 0, len = this.listeners.length; i < len; i++) {
    if (this.listeners[i] === cb) {
      this.listeners.splice(i, 1);
      return true;
    }
  }
  return false;
};

/**
 * @param {any} extraData - Any additional data to pass to each call.
 */
CbQueue.prototype.notifyAll = function notifyAll(extraData=null) {
  for (let i = 0, len = this.listeners.length; i < len; i++) {
    const cb = this.listeners[i];
    if (typeof cb === 'function') {
      cb(extraData);
    }
    else {
      console.error('CbQueue.notifyAll: not a valid function:', cb);
    }
  }
};

/**
 * @param {any} extraData - Any additional data to pass to each call.
 * @param {function} eachCb - Called in a loop. Each loop passes a registered
 *   callback or stored object. If this is undefined and the stored object is a
 *   function, then the stored function will be called instead.
 */
CbQueue.prototype.notifyInterceptAll = function notifyInterceptAll(extraData=null, eachCb) {
  for (let i = 0, len = this.listeners.length; i < len; i++) {
    const cb = this.listeners[i];
    if (typeof eachCb === 'function') {
      eachCb(cb, extraData);
    }
    else if (typeof cb === 'function') {
      cb(extraData);
    }
    else {
      console.error('CbQueue.notifyInterceptAll: not a valid function:', cb);
    }
  }
};
