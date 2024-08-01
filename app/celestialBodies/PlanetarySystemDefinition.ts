import * as THREE from 'three';
import { Star } from './bodyTypes/Star';
import { Planet } from './bodyTypes/Planet';
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
  // The name of this system. Example: Sol.
  name: string = 'Unknown System';

  allBodies: LargeGravitationalSource[] = [];
  // The primary star in this system. While not technically realistic to think
  // of a star is the "center" (the center is generally the center of gravity
  // rather than a single body), it helps with scene management.
  mainStar: Star | null = null;
  // Used for circumbinary and other systems.
  siblingStars: Star[] = [];
  planets: Planet[] = [];
  moons: Planet[] = [];
  asteroidBelts: LocalAsteroidBelt[] = [];
  comets: LocalComet[] = [];
  oortCloud: LocalOortCloud | null = null;
  private _allBodies: LargeGravitationalSource[] = [];
  private _parentScene: THREE.Scene | THREE.Group;

  constructor(name: string, parentScene: THREE.Scene | THREE.Group) {
    name && (this.name = name);
    this._parentScene = parentScene;
    // TODO: Add all bodies to _allBodies.
    // GravitySource.stepAll
  }

  /** Stores the main star, but does not add it to the scene. */
  createMainStar(Star: new () => Star) {
    this.mainStar && console.warn('Replacing main star.');
    this.mainStar = new Star();
    this.allBodies.unshift(this.mainStar);
  }

  /** Stores a planet, but does not add it to the scene. */
  createPlanet(
    Planet: new () => Planet,
    moons?: [ new (parent: Planet) => Planet ],
  ) {
    const planet = new Planet();
    this.planets.push(planet);
    this.allBodies.push(planet);
    if (moons) {
      for (let i = 0, len = moons.length; i < len; i++) {
        const Moon = moons[i];
        const moon = new Moon(planet);
        this.moons.push(moon);
        this.allBodies.push(moon);
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

  _addBodiesToScene(bodies: LargeGravitationalSource[]) {
    for (let i = 0, len = bodies.length; i < len; i++) {
      this._parentScene.add(bodies[i].container);
      // console.log('adding:', bodies[i].container);
    }
  }

  /**
   * Add all planets to the scene, and inform navigation of our available
   * systems.
   */
  activateSystem() {
    this.mainStar && this._addBodiesToScene([ this.mainStar ]);
    this._addBodiesToScene(this.planets);
    this._addBodiesToScene(this.moons);
  }

  ejectAllFromScene() {
    // TODO: Release all resources.
  }

  stepLargeBodyOrbits(
    time: number,
    bodies: LargeGravitationalSource[],
    viewerPosition: THREE.Vector3,
  ) {
    for (let i = 0, len = bodies.length; i < len; i++) {
      bodies[i].step(time, viewerPosition);
    }
  }

  step(time: number, viewerPosition: THREE.Vector3) {
    const bodies = this.allBodies;
    for (let i = 0, len = bodies.length; i < len; i++) {
      bodies[i].step(time, viewerPosition);
    }
  }
}

export {
  PlanetarySystemDefinition,
};
