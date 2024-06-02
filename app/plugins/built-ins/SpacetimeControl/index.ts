import _ from 'lodash';
import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { CoordType } from './types/CoordType';
import { capitaliseFirst } from '../../../local/utils';

type AdderSignature = (direction: THREE.Vector3, speed: number) => void;

let _tmpDirection = new THREE.Vector3();

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
  private _reality: THREE.Group = new THREE.Group();
  private _levelBubble: THREE.Group = new THREE.Group();
  private _levelId: number | null = null;
  // Our real coordinates inside the universe, in meters.
  // public universeCoordsM: THREE.Object3D = new THREE.Object3D();
  // public universeRotationM: THREE.Object3D = new THREE.Object3D();
  private _coordMode: CoordType;
  private readonly _movementFunctions: (AdderSignature)[];
  private _adder: AdderSignature;

  constructor() {
    this._setupWatchers();
    this._coordMode = CoordType.playerCentric;
    this._reality.add(this._levelBubble);

    this._adder = () => {
    };
    this._movementFunctions = [];
    this._setupAdders();
  }

  _setupWatchers() {
  }

  // Within the context of this class, adders are functions that move the
  // player's location around. They are tied to the CoordType enum.
  _setupAdders() {
    _.each(CoordType, (numericKey, stringKey) => {
      if (!isNaN(numericKey)) {
        // Example of what this looks like: addPlayerCentric
        const adder = `addVector${capitaliseFirst(stringKey)}`;
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

  // The object passed into this function becomes part of spacetime, and
  // henceforth managed by it.
  enterReality(object: THREE.Group | THREE.Scene) {
    this._reality.add(object);
    console.log('[enterReality] Received new object.', this._reality.children);
  }

  // Transforms the specified object into the relative center of the universe.
  // The specified object must have been added via spacetime.enterReality,
  // first.
  setLevel(objectId: number) {
    // Move the previous level from the level bubble to normal reality.
    if (this._levelId) {
      const scene = this._levelBubble.getObjectById(objectId);
      if (scene) {
        this._levelBubble.remove(scene);
        this._reality.add(scene);
      }
      this._levelId = null;
    }

    // Move the specified object from normal reality into the level bubble.
    const scene = this._reality.getObjectById(objectId);
    if (!scene) {
      console.error(`[setLevel] Object '${objectId}' does not exist in this reality`);
      return;
    }
    this._reality.remove(scene);
    this._levelBubble.add(scene);
    this._levelId = objectId;
  }

  calculateEffectiveCoords() {
    console.log('tba');
  }

  // Moves the player relative to the world, or moves the world relative to the
  // player, depending on current world coordinate mode.
  add(direction: THREE.Vector3, speed: number) {
    // Example: this.addPlayerCentric(direction, speed);
    this._adder(direction, speed);
  }

  // Move galaxy around the player.
  moveForwardPlayerCentric(speed: number, forwardObject: THREE.Object3D) {
    forwardObject.getWorldDirection(_tmpDirection);
    this._reality.position.addScaledVector(_tmpDirection, speed);
    this._levelBubble.position.addScaledVector(_tmpDirection, -speed);
  }

  rotatePlayerCentric(pitch: number, yaw: number, roll: number) {
    // The level bubble should only ever contain 1 or 0 children (we can make
    // it size agnostic, but doing so is semantically meaningless and thus a
    // waste of CPU).
    const level = this._levelBubble.children[0];
    if (level) {
      level.rotateX(pitch);
      level.rotateY(yaw);
      level.rotateZ(roll);
    }
  }

  // Move galaxy around the player.
  addVectorPlayerCentric(speed: number, camera: THREE.PerspectiveCamera) {
    // console.log('---> 1 | addPlayerCentric');
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
  }
}

const spacetimeControl = new CosmosisPlugin('spacetimeControl', SpacetimeControl);

export {
  SpacetimeControl,
  spacetimeControl,
};
