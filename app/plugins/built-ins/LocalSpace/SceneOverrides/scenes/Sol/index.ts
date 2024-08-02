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
import { Navigation } from '../../../../Navigation';
import Player from '../../../../Player';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  player: Player,
  spacetimeControl: SpacetimeControl,
  navigation: Navigation,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

class Sol /*extends SceneOverride*/ {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private _ready = false;

  // You should prefer using store functions instead of using this directly.
  constituents: PlanetarySystemDefinition;

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

    this.constituents = new PlanetarySystemDefinition('Sol', planetaryEclipticPlane);
    this._pluginCache.core.onAnimate.getEveryChange(this.step);
  }

  /**
   * Inits the system, adds everything the parent scene, and starts the render
   * loop.
   */
  activate() {
    this.constituents.createMainStar(Sun);
    this.constituents.createPlanet(Mercury);
    this.constituents.createPlanet(Venus);
    this.constituents.createPlanet(Earth, [ EarthLuna ]);
    this.constituents.createPlanet(Mars);
    this.constituents.createPlanet(Saturn);

    this.constituents.activateSystem();
    this._pluginCache.navigation.setLocalSystem(this.constituents);
    this._ready = true;
  }

  step = () => {
    const spacetimeControl = this._pluginCache.spacetimeControl;
    if (!spacetimeControl || !this._ready) {
      return;
    }

    this.constituents.step(
      Core.animationData.j2000Time,
      this._pluginCache.player.camWorldPosition,
    );
  };
}

export {
  Sol,
};
