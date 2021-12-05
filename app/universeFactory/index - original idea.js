// Used to orchestrate the production of stars, planets, nebulae, etc.

class UniverseFactory {
  constructor() {
    // this.universe = {
    //   // We can deal with dynamic galaxies once we actually have a need for them.
    //   // For now we have the Milky Way as out only target.
    //   milky: {
    //     // Structure:
    //     // Galaxies contain 4 quadrants.
    //     // Each quadrant contains 9 chunks.
    //     //
    //     chunks: [
    //       // 0:
    //     ],
    //   }
    // };
  }

  createGalaxy = function({ localPosition }) {
    //
  };

  createLocalCluster = function() {
    //
  };

  distantSystem = function() {
    //
  };

  createSolarSystem = function() {
    //
  };

  createStar = function() {
    //
  };

  createPlanet = function() {
    //
  };

  createMoon = function({ name, diameter, reflectivity } = { procedural: true }) {
    //
  };
}
