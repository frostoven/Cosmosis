/**
 * Event emitter that offers the option to remember what has already been
 * emitted. Useful for calling things like 'onGameReady' long after the
 * onGameReady event has been emitted. Note that cached events do not store the
 * original passed args to save on memory, and assume you have a different
 * source of truth.
 *
 * Cached events use enums to the power of 2, while non-cached enums are
 * in increments of 1.
 * @constructor
 */
function CachedEmitter(
  { rememberPastEvents=true } = {rememberPastEvents: true}
) {
  if (!rememberPastEvents) {
    // TODO: implement me.
    throw 'CachedEmitter does not yet support use without caching';
  }

  /** Used to notify different parts of the application that different pieces of
   * the application has been loaded. */
  this._listeners = [];

  // Bitmask used to keep track of what's been loaded.
  this._pastEvents = 0;

  // Enables event caching.
  this._rememberPastEvents = rememberPastEvents;

  // Used to generate the startupEvent enum.
  this._currentExp2Enum = 1;

  // Used if remembering past events is not needed.
  this._currentPlainEnum = 1;


}

CachedEmitter.prototype = {
  get rememberPastEvents() {
    return this._pastEvents;
  },
  set rememberPastEvents(b) {
    // Remembered vs. not remembered uses different kinds of enums. Disallow
    // mixing.
    throw 'rememberPastEvents is read-only; please set it during ' +
    'initialisation.\n' +
    `Example: "new CachedEmitter({rememberPastEvents: ${b}})"`;
  },
};

/**
 * Returns next enum in powers of 2. Power of 2 are used for fast bitmask
 * checking internally.
 * @returns {number}
 */
CachedEmitter.prototype._nextExp2Enum = function nextExp2Enum() {
  return 2 ** this._currentExp2Enum++;
};

/**
 * Returns numbers current enum + 1.
 * @returns {number}
 * @private
 */
CachedEmitter.prototype._nextPlainEnum = function nextExp2Enum() {
  return this._currentPlainEnum++;
};

/**
 * Automatically figures out which enum to use. For cached emitters, these are
 * numbers in powers of 2. Otherwise, they're simply in increments of 1.
 */
CachedEmitter.prototype.nextEnum = function nextEnum() {
  if (this._rememberPastEvents) {
    return this._nextExp2Enum();
  }
  else {
    return this._nextPlainEnum();
  }
};

/**
 * Notify requesters when a part of the application has loaded.
 *
 * If you request to be notified when something loads, but it has already
 * finished loading, then you'll be notified as soon as you make the request.
 * This allows you to safely check application state at any time regardless of
 * current load state.
 *
 * @param {number} action
 * @param {function} callback
 */
CachedEmitter.prototype.on = function CachedEmitterOn(action, callback) {
  if (typeof action === 'undefined') {
    return console.error('CachedEmitter.on() received an invalid action.');
  }
  if ((action & this._pastEvents) === action) {
    // Action has already happened.
    callback();
  }
  else {
    // Log request.
    this._listeners.push({ action, callback });
  }
};

/**
 * Notifies all listener that part of the application has loaded.
 * @param {number} action - startupEvent item.
 */
CachedEmitter.prototype.emit = function CachedEmitterEmit(action) {
  if (typeof action === 'undefined') {
    return console.error('CachedEmitter.emit() received an invalid action.');
  }
  // A part of the application booted. Store the id, then notify all the
  // listeners.
  const listeners = this._listeners;
  // Add action to past events.
  this._pastEvents |= action;

  // Note: we use a loop-backwards/double-loop mechanism, because it seems to
  // be the only way to stop concurrency issues. Basically, it seems that
  // calling callbacks mid-loop causes execution delays, resulting in some
  // callbacks never being triggered.

  const foundCallbacks = [];
  let i = listeners.length;
  while (i--) {
    // TODO: remove me.
    if (i < 0) {
      console.error('CachedEmitter [157]: DETECTED CONCURRENCY ISSUE');
      break;
    }

    const item = listeners[i];
    if (item.action === action) {
      listeners.splice(i, 1);
      foundCallbacks.push(item.callback);
    }
  }

  for (let i = 0, len = foundCallbacks.length; i < len; i++) {
    foundCallbacks[i]();
  }
}

/**
 * Removes a past action from the remembered cache. If this object does not use
 * caching, then this function does nothing.
 *
 * This is used to unset events such as the player's space ship being loaded.
 * When loading a new space ship, a new event is triggered.
 *
 * TODO: send out an event specifying that we're forgetting a cached action.
 *  This may help with things like clean-up, loading indicators, etc.
 * @param action
 */
CachedEmitter.prototype.forgetCachedAction = function forgetCachedAction(action) {
  if (!this.rememberPastEvents) {
    return;
  }
  // Remove the specified action.
  this._pastEvents ^= action;
};

export default CachedEmitter;
