import UniverseFactory from './UniverseFactory';

// const hugeData =[];
// const limit = 2000000;
// // 68ms to calculate the distances for all of these :)
// for (let i = 0, len = limit; i < len; i++) {
//   hugeData.push(
//     {
//       i: i,
//       n: i,
//       x: i / limit, y: i / limit, z: i / limit,
//       N: 1000 * (i / limit),
//       K: { r: 1, g: 0.823, b: 0.715 },
//     });
// }

const universe = new UniverseFactory();
function prepareGalaxyData({ catalogs=[] } = {}) {
  if (catalogs && catalogs.length) {
    for (let i = 0, len = catalogs.length; i < len; i++) {
      const catalog = catalogs[i];
      universe.addStarData(catalog);
    }
    console.log('Galactic data ready.');
    return;
  }

  // return universe.addStarData(hugeData);

  const testData = [
    {
      i: UniverseFactory.SOL,             // id
      n: 'Sol',                           // name
      x: 0, y: 0, z: 0,                   // position relative to the ecliptic
      N: 1,                               // luminosity relative to the sun
      K: { r: 1.000, g: 0.867, b: 0.815 }, // blackbody colour
    },
    {
      i: 5459, // BSC5P
      n: 'Alpha Centauri A', // Rigil Kentaurus
      x: -1.1752508252610874, y: 0.4207517813325198, z: -0.5031767498569927,
      N: 1.4666388569016384,
      K: { r: 1, g: 0.823, b: 0.715 },
    },
    {
      i: 5460, // BSC5P
      n: 'Alpha Centauri B', // Toliman
      x: -1.1752912894147416, y: 0.42065291322557685, z: -0.5031649003941662,
      N: 0.4294214128634803,
      K: { r: 1, g: 0.613, b: 0.338 },
    },
    {
      i: 'custom1', // manual. note: this star's data is an educational guess.
      n: 'Proxima Centauri',
      x: -1.1752710573379144, y: 0.4207023472790483, z: -0.5031708251255794,
      N: 0.0017, // from Wikipedia.
      K: { r: 1, g: 0.463, b: 0.159 }, // this value is pretty accurate
    },
    {
      i: 'custom2', // manual. note: this star's data is an educational guess.
      n: '61 Cygni A',
      x: 2.187050816378065,  // these are completely wrong, only the distance
      y: 1.8683445202575937, //   is approximately right (3.495256 p).
      z: 1.9847386036854515,
      N: 0.153,
      K: { r: 1.000, g: 0.714, b: 0.500 }, // 4,526 K
    },
    {
      i: 'custom3', // manual. note: this star's data is an educational guess.
      n: '61 Cygni B',
      x: 2.187030816378065,  // these are completely wrong, only the distance
      y: 1.8684445202575937, //   is approximately right (3.495256 p).
      z: 1.9847286036854515,
      N: 0.085,
      K: { r: 1.000, g: 0.647, b: 0.389 }, // 4,077 K
    },
  ];
  universe.addStarData(testData);
  console.log('Galactic data ready.');
}

function getVisibleStars(options) {
  return universe.getVisibleStars(options);
}

export {
  prepareGalaxyData,
  getVisibleStars,
}
