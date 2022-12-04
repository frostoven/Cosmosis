import { PerspectiveCamera, Vector3 } from 'three';
import { gameState } from '../../gameState';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { CoordType } from './types/CoordType';

class Location {
  // The coordinates we are supposedly at. We say supposedly, because exact
  // location depends on the kind of coordinate system we're currently chasing,
  // and the scene's own distance units. This variable's units are in meters.
  public effectiveCoords: Vector3;
  // public worldScaleVector: Vector3;
  private _cachedCamera: PerspectiveCamera;
  public coordMode: CoordType;

  constructor() {
    this.setupWatchers();
    this.effectiveCoords = new Vector3();
    this._cachedCamera = new PerspectiveCamera();
    this.coordMode = CoordType.playerCentric;
  }

  setupWatchers() {
    gameState.tracked.player.getEveryChange((camera) => {
      this._cachedCamera = camera;
    });
  }

  calculatePlayerLocation() {
    // const v = new Vector3();
  }

  // Moves the player relative to the world, or moves the world relative to the
  // player, depending on current world coordinate mode.
  update(direction: Vector3, speed) {
    // if moving player with physics, just update ship position.
    // if moving universe, just update universe position.
  }

  // Update effective coordinates, and updates the world to reflect this.
  set(location: Vector3) {
    this.effectiveCoords.copy(location);
    // TODO:
    //  * set player ship location to zero.
  }
}

const locationPlugin = new CosmosisPlugin('location', Location);

export {
  locationPlugin,
}
