import ChangeTracker from 'change-tracker/src';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { LocalBodies } from './interfaces/LocalBodies';
import { LocalStars } from './interfaces/LocalStars';
import { logBootTitleAndInfo } from '../../../local/windowLoadListener';
import PluginLoader from '../../types/PluginLoader';
import {
  PlanetarySystemDefinition,
} from '../../../celestialBodies/PlanetarySystemDefinition';
import {
  LargeGravitationalSource,
} from '../../../celestialBodies/LargeGravitationalSource';

// Not to be confused with the ship navigation module. This plugin offers
// points of interest, solar system locations, and proxies universe data.
class Navigation {
  public onNearbyStarDetected: ChangeTracker;
  private _system: PlanetarySystemDefinition | null = null;

  constructor() {
    logBootTitleAndInfo('Driver', 'Navigation', PluginLoader.bootLogIndex);
    this.onNearbyStarDetected = new ChangeTracker();
  }

  // Get points of interest in the local solar system.
  getSystemPOIs() {
    return {
      spaceships: [],
      spaceStations: [],
      asteroidStations: [],
    };
  }

  getSystemName() {
    return this._system?.name || 'Unknown System';
  }

  // Returns bodies in the local solar system, if any.
  getPlanetaryData(): LocalBodies {
    if (!this._system) {
      return {
        stars: [],
        planets: [],
        moons: [],
      };
    }

    return {
      stars: [ this._system.mainStar ],
      planets: this._system.planets,
      moons: this._system.moons,
    };
  }

  // Returns bodies in the local solar system, if any.
  getAllPlanetaryBodies(): LargeGravitationalSource[] {
    if (!this._system) {
      return [];
    }
    else {
      return this._system.allBodies;
    }
  }

  // Returns all stars within a 20 light-year distance regardless of
  // visibility.
  getLocalStars(): LocalStars {
    return {
      stars: [],
    };
  }

  setLocalSystem(system: PlanetarySystemDefinition) {
    this._system = system;
  }
}

const navigationPlugin = new CosmosisPlugin('navigation', Navigation);

export {
  Navigation,
  navigationPlugin,
};
