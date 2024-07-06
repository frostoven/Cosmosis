import * as THREE from 'three';
import {
  PlanetarySystemDefinition,
} from '../../../../../../celestialBodies/PlanetarySystemDefinition';
import { SceneOverride } from '../../SceneOverride';
import { Sun } from './Sun';
import { Saturn } from './Saturn';
import PluginCacheTracker from '../../../../../../emitters/PluginCacheTracker';
import Core from '../../../../Core';
import { Mercury } from './Mercury';
import { Venus } from './Venus';
import { Earth } from './Earth';
import { EarthLuna } from './EarthLuna';
import { Mars } from './Mars';
import { SpacetimeControl } from '../../../../SpacetimeControl';
import { eclipticAngle } from './defs';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  spacetimeControl: SpacetimeControl,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------


class Sol /*extends SceneOverride*/ {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  constituents: PlanetarySystemDefinition;
  private _ready = false;

  constructor(parentScene: THREE.Scene | THREE.Group) {

    const planetaryEclipticPlane = new THREE.Group();
    parentScene.add(planetaryEclipticPlane);
    planetaryEclipticPlane.setRotationFromEuler(new THREE.Euler(
      // Align the computed Kepler orbits with the game's sky. The solar
      // system's ecliptic plane is tilted 60.2 degrees relative to the
      // galactic plane. The additional 1.5 radians here adjust for our
      // relative Three.js galactic rotation.
      1.5, -1.5 - eclipticAngle, 0,
    ));
    // @ts-ignore
    window.planetaryEclipticPlane = planetaryEclipticPlane;

    this.constituents = new PlanetarySystemDefinition(planetaryEclipticPlane);

    this._pluginCache.core.onAnimate.getEveryChange(this.step);
  }

  // Inits the system, adds everything the parent scene, and starts the render
  // loop.
  activate() {
    this.constituents.mainStar = new Sun();
    this.constituents.planets.push(new Mercury());
    this.constituents.planets.push(new Venus());
    const earth = this.constituents.planets.push(new Earth()) - 1;
    this.constituents.planets.push(new EarthLuna(this.constituents.planets[earth]));
    this.constituents.planets.push(new Mars());
    this.constituents.planets.push(new Saturn());
    this.constituents.addAllToScene();
    this._ready = true;
  }

  step = () => {
    const spacetimeControl = this._pluginCache.spacetimeControl;
    if (!spacetimeControl || !this._ready) {
      return;
    }

    const { j2000Time } = Core.animationData;
    this.constituents.step(j2000Time, spacetimeControl.getLocalPosition());
  };
}

export {
  Sol,
};
