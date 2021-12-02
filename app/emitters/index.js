import CachedEmitter from './CachedEmitter';
import EventEmitter from './EventEmitter';

// See getStartupEmitter() for details.
const startupEmitter = new CachedEmitter({ rememberPastEvents: true });

// Used to keep track of core load progress. Note that progress is
// asynchronous, and actions are not guaranteed to happen in any specific
// order. The exception to this is startupEvent.ready, which will always
// trigger last. Note that all these triggers must be called for the game to
// recognise its state as 'loaded'. If one or more items are not triggered, the
// loading screen will not end.
// TODO: add on camControllerReady.
export const startupEvent = {
  /* Game menu component has mounted. */
  menuLoaded: startupEmitter.nextEnum(),
  /** Includes things like the camera and scene (basically $game itself). */
  gameViewReady: startupEmitter.nextEnum(),
  /** The first animation() frame has been rendered. */
  firstFrameRendered: startupEmitter.nextEnum(),
  /** Game is fully loaded, core functions (like rendering) is already
   * happening. */
  ready: startupEmitter.nextEnum(),
};

// See getUiEmitter()  for details.
const uiEmitter = new EventEmitter();

/**
 * Used to keep track of core application loading. Startup events are
 * remembered, so you may use this completely asynchronously at any time as
 * though your code runs early in the boot process (even after the event has
 * already transpired).
 * TODO: rename startupEmitter. Unlike uiEmitter, startupEmitter results are
 *  cached. uiEmitter on the other hand is not. The naming needs to clearly
 *  reflect this somehow.
 *  Candidate name: startupChecklist
 * @type {CachedEmitter}
 */
export function getStartupEmitter() {
  return startupEmitter;
}

/**
 * Used to update React UI elements (please never call this emitter each
 * frame).
 */
export function getUiEmitter() {
  return uiEmitter;
}

// Used for debugging - please do not use this in code.
window.debug.uiEmitter = getUiEmitter();
// Used for debugging - please do not use this in code.
window.debug.startupEmitter = getStartupEmitter();

export default {
  startupEvent,
  getStartupEmitter,
  getUiEmitter,
}
