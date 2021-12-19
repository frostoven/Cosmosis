// Characters used to make visual distributions:
//  ░ , █ , ▄ and ▀
//
// For reference to the functions below, Math.random() looks like this:
//  ▄█▄▄ █ █ ▄ ▄  ██▄▄ █ ▄▄▄ ▄▄▄ ▄██▄▄
// ████████████████████████████████████
// ████████████████████████████████████
// ████████████████████████████████████
// Note that the ascii character values are rounded, and thus differences are
// exaggerated a bit. Math.random's distribution is actually very uniform.

// TODO: instance these functions. This is a temporary hack that will break
//  very soon.
let seed = 1;
/**
 * Extremely low entropy seeding function that intentionally produces rotating
 * values.
 * Do not use within security contexts.
 * Visual distribution:
 * ██████████████████
 * ██████████████████
 * ██████████████████
 * ██████████████████
 * @param seed
 * @param seed2
 * @returns {number}
 */
function piRng(seed2=null) {
  seed++;
  if (seed2) {
    seed ^= seed2;
  }
  const num = Math.PI * seed;
  return num - Math.floor(num);
}

seed = 1;
/**
 * Low randomness seeding function that intentionally produces patterns. Will
 * produce biased results: more at 0 and 1, gradually less at 0.5.
 * Do not use within security contexts.
 * Visual distribution:
 * █          █
 * █          █
 * █          █
 * █▄        ▄█
 * ██▄      ▄██
 * ████████████
 * @param seed
 * @param seed2
 * @returns {number}
 */
function sinRng(seed_, seed2=null) {
  if (seed_) {
    seed = seed_; // TODO: instantiate.
  }
  seed++;
  if (!seed2) {
    seed2 = seed * Math.E;
  }
  const num = Math.sin(seed * seed2);
  return num - Math.floor(num);
}

/**
 * Not seeded. On averages produces a number somewhere between 0.0001 and 1000.
 * Intentionally biases numbers toward zero. Do not use within security
 * contexts.
 * Visual distribution:
 * █
 * ██
 * ██▄▄
 * ████████
 * @param zeroBias - The higher this number is, the more numbers will tend
 * towards 0. '1' means 'no bias'.
 * @returns {number}
 */
function biasedRng(zeroBias=1.14) {
  if (zeroBias < 1) {
    zeroBias = 1;
  }
  return Math.pow(Math.random(), zeroBias);
}


// TODO: add interference pattern with slit count and factor (distance):
// https://www.shadertoy.com/view/MttcWn
// https://www.shadertoy.com/view/WsXfRN

export {
  sinRng,
}
