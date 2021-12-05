/**
 * Contains constants and functions for astrometric math.
 */

/*
 * Some performance tests for potential optimisation: I removed all sqrt
 * functions and switched to squared units to test performance, because square
 * root functions are known to be slow. The distances of 2 million stars were
 * calculated, 10 runs were performed. I only got a 3% speed increase with
 * squared units. Given that the slower sqrt method takes a mere 68
 * milliseconds on average for all 2 million distance calculations on my
 * machine, I think standard units in favour of 3% slower process time is
 * acceptable for current use (recalculations are infrequent, and in a worker).
 */

// L₀, or zero point luminosity.
const BASE_LUMINOSITY = 3.0128e28;
// Sol's output in Watts.
const SUN_LUMINOSITY = 3.828e26;

// Calculates energy received from a star using the inverse square law.
// Incorrectly assumes ideal conditions. Note that this is NOT apparent
// magnitude; '0' in this case = 'no light'. The result will never be a
// negative value. For reference, using this function:
// * Sol as viewed from Earth: 1401.110898742567              ---
// * Moon as viewed from Earth: 0.002517985487745623          ---
// * Alpha Centauri A as viewed from Earth: 0.000000025903699250502776  ---
// * Alnitak as viewed from Earth: 0.000000003732880586575866    ---
// * 61 Cygni B (dimmest star visible from Earth): 0.00000000020943724787434862
function calculateBrightness(luminosity, distanceMeters) {
  return (luminosity * SUN_LUMINOSITY) / (4.0 * Math.PI * Math.pow(distanceMeters, 2.0));
}

// The energy Earth received from Sol. Ideal value for life.
// Value: 1401.110898742567
const GOLDILOCKS_ZONE = calculateBrightness(1, 147460000000);

// Energy received from 61 Cygni B, the dimmest star visible in the night sky.
// Any star dimmer than this should not be rendered (except in stellar maps).
// This should be the right value from an ideal visibility perspective, however
// it fails for Earth-visible stars and is subsequently not used right now.
// Value: 0.00000000020943724787434862
const INVISIBLY_DIM = calculateBrightness(0.08003, 107889822800000000);

// This value can be used to very accurately determine if stars known to be
// visible from Earth should be visible in the game. It is not, however,
// mathematically sound - this number takes dust into account given the
// dimmest stars from Earth and will be wrong viewed from other parts of the
// universe. This value came into existence because 7041 Earth-visible stars
// are, according to the actual expected value (INVISIBLY_DIM), not visible -
// which is obviously wrong.
// Value: 0.00000000001647909527767568
const INVISIBLY_DIM_FROM_EARTH = calculateBrightness(0.01, 135961000000000000);

// function distanceTo(v) {
//   return Math.sqrt(this.distanceToSquared(v));
// }

// Taken from three.js distanceTo and distanceToSquared.
function distanceTo(pointA, pointB) {
  const dx = pointA.x - pointB.x,
    dy = pointA.y - pointB.y,
    dz = pointA.z - pointB.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export {
  GOLDILOCKS_ZONE,
  INVISIBLY_DIM,
  INVISIBLY_DIM_FROM_EARTH,
  calculateBrightness,
  distanceTo,
}
