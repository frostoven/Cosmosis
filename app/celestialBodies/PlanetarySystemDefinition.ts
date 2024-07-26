import * as THREE from 'three';
import { LocalStar } from './bodyTypes/LocalStar';
import { LocalPlanet } from './bodyTypes/LocalPlanet';
import { LocalAsteroidBelt } from './bodyTypes/LocalAsteroidBelt';
import { LocalComet } from './bodyTypes/LocalComet';
import { LocalOortCloud } from './bodyTypes/LocalOortCloud';
import { LargeGravitationalSource } from './LargeGravitationalSource';

/**
 * Describes everything needed to produce a planetary system, whether by hand
 * or procedurally. For the sake of convenience, this class is used even if the
 * star in question is a lone star with no planets.
 *
 * For the non-astronomers, a planetary system is a "solar" system we don't
 * live in. The term Solar System specifically to the one we live in. otherwise
 * this class would have been named SolarSystemDefinition.
 */
class PlanetarySystemDefinition {
  // The primary star in this system. While not technically realistic to think
  // of a star is the "center" (the center is generally the center of gravity
  // rather than a single body), it helps with scene management.
  mainStar: LocalStar | null = null;
  // Used for circumbinary and other systems.
  siblingStars: LocalStar[] = [];
  planets: LocalPlanet[] = [];
  asteroidBelts: LocalAsteroidBelt[] = [];
  comets: LocalComet[] = [];
  oortCloud: LocalOortCloud | null = null;
  private _allBodies: LargeGravitationalSource[] = [];
  private _parentScene: THREE.Scene | THREE.Group;

  constructor(parentScene: THREE.Scene | THREE.Group) {
    this._parentScene = parentScene;
    // TODO: Add all bodies to _allBodies.
    // GravitySource.stepAll
  }

  /** Stores the main star, but does not add it to the scene. */
  createMainStar(Star: new () => LocalStar) {
    this.mainStar && console.warn('Replacing main star.');
    this.mainStar = new Star();
  }

  /** Stores a planet, but does not add it to the scene. */
  createPlanet(
    Planet: new () => LocalPlanet,
    moons?: [ new (parent: LocalPlanet) => LocalPlanet ],
  ) {
    const planet = new Planet();
    if (moons) {
      for (let i = 0, len = moons.length; i < len; i++) {
        const Moon = moons[i];
        this.planets.push(new Moon(planet));
      }
    }
  }

  // noinspection JSUnusedGlobalSymbols - Exists to act as documentation.
  /**
   * A moon cannot exist without a planet. Please include your moon when adding
   * its parent planet via storePlanet() instead.
   * @deprecated
   */
  storeMoon(_: any) {
    console.error(
      'A moon cannot exist without a planet. Please include your moon when ' +
      'adding its parent planet via storePlanet() instead.',
    );
  }

  addAllToScene() {
    this._addBodiesToScene(this.planets);
    this.mainStar && this._addBodiesToScene([ this.mainStar ]);
  }

  ejectAllFromScene() {
    // TODO: Release all resources.
  }

  _addBodiesToScene(bodies: LargeGravitationalSource[]) {
    for (let i = 0, len = bodies.length; i < len; i++) {
      this._parentScene.add(bodies[i].container);
      console.log('adding:', bodies[i].container);
    }
  }

  stepLargeBodyOrbits(
    time: number,
    bodies: LargeGravitationalSource[],
    viewerPosition: THREE.Vector3,
  ) {
    this.mainStar?.step(time, viewerPosition);
    for (let i = 0, len = bodies.length; i < len; i++) {
      this.planets[i].step(time, viewerPosition);
      // console.log(this.planets[i].positionM);
    }
  }

  step(time: number, viewerPosition: THREE.Vector3) {
    this.stepLargeBodyOrbits(time, this.planets, viewerPosition);
  }
}

export {
  PlanetarySystemDefinition,
};
