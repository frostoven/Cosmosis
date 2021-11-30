// Used to orchestrate the production of stars, planets, nebulae, etc.

function UniverseFactory() {
  this.universe = {
    // We can deal with dynamic galaxies once we actually have a need for them.
    // For now we have the Milky Way as out only target.
    milky: {
      // Structure:
      // Galaxies contain 4 quadrants.
      // Each quadrant contains 9 chunks.
      //
      chunks: [
        // 0:
      ],
    }
  };
}

// UniverseFactory.protoype.createGalaxy = function({ localPosition }) {
//   //
// };

UniverseFactory.protoype.createLocalCluster = function() {
  //
};

UniverseFactory.protoype.distantSystem = function() {
  //
};

UniverseFactory.protoype.createSolarSystem = function() {
  //
};

UniverseFactory.protoype.createStar = function() {
  //
};

UniverseFactory.protoype.createPlanet = function() {
  //
};

UniverseFactory.protoype.createMoon = function({ name, diameter, reflectivity } = { procedural: true }) {
  //
};
