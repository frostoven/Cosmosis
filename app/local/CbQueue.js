/**
 * Simple prototype for handling registering and deregistering of pretty much
 * anything, although specifically made to deduplicate callback boilerplate.
 * @constructor
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
}

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
}

/**
 *
 * @param {any} eachCb - Called in a loop. Each loop passes a registered
 *   callback or stored object. If this is undefined and the stored object is a
 *   function, then the stored function will be called instead.
 */
CbQueue.prototype.notifyAll = function notifyAll(eachCb) {
    for (let i = 0, len = this.listeners.length; i < len; i++) {
        const cb = this.listeners[i];
        if (eachCb) {
            eachCb(cb);
        }
        else if (typeof cb === 'function') {
            cb();
        }
    }
}
