// Extremely low randomness seeding function that intentionally produces
// patterns. Will produce *visibly* biased results.
// Do not use within security contexts.
function piRng(seed=1, seed2=null) {
  if (seed2) {
    seed ^= seed2;
  }
  const num = Math.PI * seed;
  return num - Math.floor(num);
}

// Low randomness seeding function that intentionally produces patterns. Will
// produce biased results.
// Do not use within security contexts.
function sinRng(seed, seed2=null) {
  if (!seed2) {
    seed2 = seed * Math.E;
  }
  const num = Math.sin(seed * seed2);
  return num - Math.floor(num);
}

// Not seeded. On averages produces a number somewhere between 0.0001 and 1000.
function explosiveRng() {
  return Math.pow(Math.random(), 16);
}
