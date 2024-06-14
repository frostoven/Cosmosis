import * as THREE from 'three';
import { LocalStar } from './LocalStar';
import { LocalPlanet } from './LocalPlanet';
import { LocalAsteroidBelt } from './LocalAsteroidBelt';
import { LocalComet } from './LocalComet';
import { LocalOortCloud } from './LocalOortCloud';
import { LargeGravitationalSource } from '../LargeGravitationalSource';

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
  private _parentScene: THREE.Scene;

  constructor(parentScene: THREE.Scene) {
    this._parentScene = parentScene;
    // TODO: Add all bodies to _allBodies.
    // GravitySource.stepAll
  }

  addAllToScene() {
    this._addBodiesToScene(this.planets);
  }

  ejectAllFromScene() {
    // TODO: Release all resources.
  }

  _addBodiesToScene(bodies: LargeGravitationalSource[]) {
    for (let i = 0, len = bodies.length; i < len; i++) {
      this._parentScene.add(bodies[i].mesh);
      console.log('adding:', bodies[i].mesh);
    }
  }

  stepLargeBodyOrbits(time: number, bodies: LargeGravitationalSource[]) {
    for (let i = 0, len = bodies.length; i < len; i++) {
      this.planets[i].step(time);
      // console.log(this.planets[i].positionM);
    }
  }

  step(time: number) {
    this.stepLargeBodyOrbits(time, this.planets);
  }
}

export {
  PlanetarySystemDefinition,
};
