import _ from 'lodash';
import * as THREE from 'three';
import { gameRuntime } from '../../gameRuntime';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { CoordType } from './types/CoordType';
import { capitaliseFirst } from '../../../local/utils';

/**
 * Controls spacetime from the level origin's point of view.
 * The following paradigm is important to understand:
 * * Spaceships you inhabit are treated as levels.
 * * Spaceships other players inhabit are treated as actors.
 * * The rest of the universe's contents (whether stars, planets, stations, or
 *   rocks) are actors.
 * * If an actor can be landed on (space station, planet), and you land on it,
 *   that actor becomes the level and your spaceship becomes an actor within
 *   the new level.
 */
class SpacetimeControl {
  // TODO: shift world based on last known position during boot.

  // public worldScaleVector: THREE.Vector3;

  // Our real coordinates inside the universe, in meters.
  public universeCoordsM: THREE.Object3D;
  public universeRotationM: THREE.Object3D;
  private _coordMode: CoordType;
  // private _cachedCamera: PerspectiveCamera;
  // private _cachedLevelScene: Scene;
  // private _cachedSpaceScene: Scene;
  private readonly _movementFunctions: any[];
  private _adder: (direction: THREE.Vector3, speed: number) => void;

  constructor() {
    this._setupWatchers();
    this.universeCoordsM = new THREE.Object3D();
    this.universeRotationM = new THREE.Object3D();
    this._coordMode = CoordType.playerCentric;

    // this._cachedCamera = new PerspectiveCamera();
    // this._cachedLevelScene = new Scene();
    // this._cachedSpaceScene = new Scene();

    this._adder = () => {
    };
    this._movementFunctions = [];
    this._setupAdders();
  }

  _setupWatchers() {
    // gameRuntime.tracked.player.getEveryChange((camera) => {
    //   this._cachedCamera = camera;
    // });
    // gameRuntime.tracked.levelScene.getEveryChange((scene) => {
    //   this._cachedLevelScene = scene;
    // });
    // gameRuntime.tracked.spaceScene.getEveryChange((scene) => {
    //   this._cachedSpaceScene = scene;
    // });
  }

  // Within the context of this class, adders are functions that move the
  // player's location around. They are tied to the CoordType enum.
  _setupAdders() {
    _.each(CoordType, (numericKey, stringKey) => {
      if (!isNaN(numericKey)) {
        // Example of what this looks like: addPlayerCentric
        const adder = `add${capitaliseFirst(stringKey)}`;
        // console.log(`===> found: ${numericKey}; adder:`, adder);
        if (typeof this[adder] === 'function') {
          this._movementFunctions[numericKey] = this[adder].bind(this);
        }
      }
    });
    console.log('--> _movementFunctions:', this._movementFunctions);
  }

  get coordMode() {
    return this._coordMode;
  }

  set coordMode(mode) {
    const adder = this._movementFunctions[mode];
    if (adder) {
      this._coordMode = mode;
      this._adder = adder;
    }
    else {
      console.error('[SpacetimeControl] Bad coordMode', mode);
    }
  }

  calculateEffectiveCoords() {
    // const v = new THREE.Vector3();
    console.log('tba');
  }

  // Moves the player relative to the world, or moves the world relative to the
  // player, depending on current world coordinate mode.
  add(direction: THREE.Vector3, speed) {
    // Example: this.addPlayerCentric(direction, speed);
    this._adder(direction, speed);
  }

  // Move galaxy around the player.
  addVectorPlayerCentric(direction: THREE.Vector3, speed) {
    // console.log('---> 1 | addPlayerCentric');
    this.universeCoordsM.position.addScaledVector(direction, speed);
  }

  // Move player through galaxy.
  addVectorGalaxyCentric(direction: THREE.Vector3, speed) {
    // console.log('---> 2 | addGalaxyCentric');
  }

  // Move player relative to level.
  addVectorGhostCentric(direction: THREE.Vector3, speed) {
    // console.log('---> 3 | addGhostCentric');
  }

  // Update effective coordinates, and updates the world to reflect this.
  set(location: THREE.Vector3, levelOrigin: THREE.Scene) {
    this.universeCoordsM.position.copy(location);
    // TODO:
    //  * set player ship location to zero.
  }
}

const spacetimeControl = new CosmosisPlugin('spacetimeControl', SpacetimeControl);

export {
  SpacetimeControl,
  spacetimeControl,
};
