/*
 * Contains a set of functions for easy access. The idea is that all major and
 * frequently used functions should reside here.
 *
 * When writing code intended for native use (in other words, you're not
 * writing a mod), please do not run API functions each frame! API functions
 * have a ton of overhead to prevent mod crashes. As an example, it's
 * appropriate to use API function calls inside menus, but it's not appropriate
 * to put an API function call inside a render function.
 */

import { startupEvent, getStartupEmitter } from '../emitters';
import contextualInput from './contextualInput';
const startupEmitter = getStartupEmitter();
const ready = startupEvent.ready;

/**
 * Sets the player ship location. If the ship has not yet been loaded, queues
 * the request.
 */
export function setPlayerShipLocation({ x, y, z }={}) {
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    return console.error('api.setPlayerShipLocation requires {x,y,z}.');
  }
  // TODO: test both in regular and warp bubble space.
  //  * If warp bubble, push world and ship in opposite directions to keep the
  //    player's location at real location 0. This prevents glitches at very
  //    fast speeds.
  //  * If regular space, ship is set to center of universe and transformations
  //    are ignored from there on out (for now, anyway; we may reset every now
  //    and again if player moves very far from origin).
  $game.playerShip.getOnce((playerShip) => {
    if ($game.hyperMovement) {
      // TODO: get this from the active LSG.
      playerShip.mesh.scene.position.set(0, 0, 0);
      playerShip.warpBubble.position.set(x, y, z);

      // Keep the macro and micro scenes positions in sync.
      $game.spaceScene.position.set(-x, -y, -z);
      $game.levelScene.position.set(-x, -y, -z);
    }
    else {
      console.error(
        'api.setPlayerShipLocation() not yet available outside of warp.'
      );
    }
  });
}

/**
 * Gets the player ship rotation by reference. If the ship has not yet been
 * loaded, queues the request.
 */
export function getPlayerShipLocation(cb=()=>{}) {
  // TODO: test both in regular and warp bubble space.
  $game.playerShip.getOnce((playerShip) => {
    if ($game.hyperMovement) {
      cb(playerShip.warpBubble.position);
    }
    else {
      console.error(
        'api.getPlayerShipLocation() not yet available outside of warp.'
      );
      cb('api.getPlayerShipLocation() not yet available outside of warp.');
    }
  });
}

/**
 * Sets the player ship rotation. If the ship has not yet been loaded, queues
 * the request.
 */
export function setPlayerShipRotation({ x, y, z }={}) {
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    return console.error('api.setPlayerShipRotation requires {x,y,z}.');
  }
  // TODO: test both in regular and warp bubble space.
  $game.playerShip.getOnce((playerShip) => {
    playerShip.warpBubble.rotation.set(x, y, z);
  });
}

/**
 * Gets the player ship rotation by reference. If the ship has not yet been
 * loaded, queues the request.
 */
export function getPlayerShipRotation(cb=()=>{}){
  // TODO: test both in regular and warp bubble space.
  $game.playerShip.getOnce(() => {
    cb($game.playerWarpBubble.rotation);
  });
}

/**
 * Triggers an action. If the game is still loading, queues the request.
 *
 * Actions are what players assign key bindings to - example, engageHyperdrive,
 * toggleFullscreen, thrustReset, etc. See controls.js for a list of these.
 * @param {string} action - name of the action as defined in controls.js.
 * @param {object} analogData [analogData] - optional analog data, such as x,y coords.
 */
export function triggerAction(action, analogData=null) {
  startupEmitter.on(ready, () => {
    // TODO: make this trigger a keyDown too.
    contextualInput.ContextualInput.triggerAction({
      action, analogData,
    });
  });
  // TODO: add holdAction and releaseAction functions.
}

export default {
  setPlayerShipLocation,
  getPlayerShipLocation,
  setPlayerShipRotation,
  getPlayerShipRotation,
  triggerAction,
}
