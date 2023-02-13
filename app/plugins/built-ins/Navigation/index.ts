import ChangeTracker from 'change-tracker/src';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { LocalBodies } from './interfaces/LocalBodies';
import { LocalStars } from './interfaces/LocalStars';

// Not to be confused with the ship navigation module. This plugin offers
// points of interest, solar system locations, and proxies universe data.
class Navigation {
  public onNearbyStarDetected: ChangeTracker;

  constructor() {
    this.onNearbyStarDetected = new ChangeTracker();
  }

  // Get points of interest in the local solar system.
  getSystemPOIs() {
    return {
      spaceships: [],
      spaceStations: [],
      asteroidStations: [],
    }
  }

  // Returns bodies in the local solar system, if any.
  getPlanetaryData(): LocalBodies {
    return {
      stars: [],
      planets: [],
      moons: [],
    }
  }

  // Returns all stars within a 20 light-year distance regardless of
  // visibility.
  getLocalStars(): LocalStars {
    return {
      stars: [],
    }
  }
}

const navigationPlugin = new CosmosisPlugin('navigation', Navigation);

export {
  navigationPlugin,
}
