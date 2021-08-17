/**
 * Provides functionality for handling registering and deregistering of pretty
 * much anything, although specifically made to deduplicate callback
 * boilerplate.
 * @constructor
 */
export default function CbQueueExtra() {
  this.listeners = [];
};

/**
 * Registers a listener that will be called if a change occurs.
 * @param {any} cb - Callback or object being registered.
 * @param {string} [name] - Optional; can be used to give a callback a name.
 *  Note that names are *not* unique. Names exist specifically to combat the
 *  problem where maps can't be used for multiple named callbacks with clashing
 *  names.
 */
CbQueueExtra.prototype.register = function registerListener(cb, name=null) {
  this.listeners.push({ cb, name });
};

/**
 * Removes a previously registered function. Requires a reference to the same
 * function that was used in registerListener.
 * @param {any} cb - Callback or object being deregistered.
 * @param {string} [name] - May be used if the callback has a name.
 * @returns {boolean}
 */
CbQueueExtra.prototype.deregister = function deregisterListener(cb, name=null) {
  for (let i = 0, len = this.listeners.length; i < len; i++) {
    const entry = this.listeners[i];
    if ((cb && entry.cb === cb) || (name && entry.name === name)) {
      this.listeners.splice(i, 1);
      return true;
    }
  }
  return false;
};

/**
 * Deregisters a callback using its string name.
 * @param name
 * @returns {boolean}
 */
CbQueueExtra.prototype.deregisterViaName = function deregisterViaName(name) {
  return this.deregister(null, name);
};


/**
 * Notify all registered listeners of some info.
 * @param {any} extraData - Any additional data to pass to each call.
 * @returns {{pings: number}} - The amount of callbacks that returned a truthy value.
 */
CbQueueExtra.prototype.notifyAll = function notifyAll(extraData=null) {
  let pings = 0;
  for (let i = 0, len = this.listeners.length; i < len; i++) {
    const cb = this.listeners[i].cb;

    // TODO: this has not actually happened, but something similar did happen
    //  in notifyAllViaName and needs to be investigated.
    if (!cb) {
      console.warn('CbQueueExtra.notifyAll: tried to notify a non-existing item.');
      continue;
    }

    if (typeof cb === 'function') {
      if (cb(extraData)) {
        pings++;
      }
    }
    else {
      console.error('CbQueueExtra.notifyAll: not a valid function:', cb);
    }
  }
  return { pings };
};

/**
 * Like notifyAll, but uses 'name' as a filter.
 * @param name
 * @param [extraData]
 * @returns {{pings: number}} - The amount of callbacks that returned a truthy value.
 */
CbQueueExtra.prototype.notifyAllViaName = function notifyAllViaName(name, extraData=null) {
  let pings = 0;
  for (let i = 0, len = this.listeners.length; i < len; i++) {
    const item = this.listeners[i];

    // TODO: investigate why this happens. Likely because we're popping from
    //  the queue while things are being read.
    if (!item) {
      console.warn('CbQueueExtra.notifyAllViaName: tried to notify a non-existing item.');
      continue;
    }

    if (name === item.name) {
      const cb = item.cb;
      if (typeof cb === 'function') {
        if (cb(extraData)) {
          pings++;
        }
      }
      else {
        console.error('CbQueueExtra.notifyAll: not a valid function:', cb);
      }
    }
  }
  return { pings };
};

/**
 * @param {any} extraData - Any additional data to pass to each call.
 * @param {function} eachCb - Called in a loop. Each loop passes a registered
 *   callback or stored object. If this is undefined and the stored object is a
 *   function, then the stored function will be called instead.
 */
CbQueueExtra.prototype.notifyInterceptAll = function notifyInterceptAll(extraData=null, eachCb) {
  for (let i = 0, len = this.listeners.length; i < len; i++) {
    const cb = this.listeners[i].cb;
    if (typeof eachCb === 'function') {
      eachCb(cb, extraData);
    }
    else if (typeof cb === 'function') {
      cb(extraData);
    }
    else {
      console.error('CbQueueExtra.notifyInterceptAll: not a valid function:', cb);
    }
  }
};
