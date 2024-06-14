// Defines an orbit via Keplerian elements.
interface OrbitalElements {
  // Semi-major axis in meters.
  semiMajorAxisM: number,
  // Eccentricity.
  eccentricity: number,
  // Inclination in radians.
  inclination: number,
  // Argument of periapsis in radians.
  argPeriapsis: number,
  // Longitude of ascending node in radians.
  ascendingNode: number,
  // Mean anomaly at epoch.
  meanAnomaly: number,
  // Epoch. Should be 0 unless manual adjustment is needed.
  referenceTime: number,
}

export {
  OrbitalElements,
};
