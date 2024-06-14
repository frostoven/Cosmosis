import * as THREE from 'three';
import { LargeGravitationalSource } from '../LargeGravitationalSource';

const { atan2, sin, cos, sqrt } = Math;

// Sun's mass in kg.
const sunMass = 1.989e30;
// Gravitational constant.
const G = 6.67430e-11;

// Function to update positions and velocities each frame
function stepKeplerOrbitalMotion(
  body: LargeGravitationalSource, mesh: THREE.Mesh, t: number
) {
  keplerToCartesian(body, t);
  mesh.position.copy(body.positionM);
}

// Function to calculate position and velocity from Keplerian elements.
function keplerToCartesian(body: LargeGravitationalSource, t: number) {
  const {
    semiMajorAxisM,
    eccentricity,
    inclination,
    argPeriapsis,
    ascendingNode,
    meanAnomaly,
    referenceTime,
  } = body.orbitalElements;
  const parent = body.parent;

  // Mean motion.
  const n = sqrt(
    G * (parent ? parent.massKg : sunMass) /
    (semiMajorAxisM ** 3),
  );
  const meanAnomalyAtTime = meanAnomaly + n * (t - referenceTime); // Mean anomaly

  // Solve Kepler's Equation for Eccentric Anomaly.
  let eccentricAnomaly = meanAnomalyAtTime;
  for (let j = 0; j < 10; j++) {
    eccentricAnomaly = meanAnomalyAtTime + eccentricity * sin(eccentricAnomaly);
  }

  // True Anomaly.
  const trueAnomaly = 2 * atan2(
    sqrt(1 + eccentricity) * sin(eccentricAnomaly / 2),
    sqrt(1 - eccentricity) * cos(eccentricAnomaly / 2),
  );

  // Distance.
  const distance = semiMajorAxisM * (1 - eccentricity ** 2) / (1 + eccentricity * cos(trueAnomaly));

  // Position in orbital plane.
  const xOrbital = distance * cos(trueAnomaly);
  const yOrbital = distance * sin(trueAnomaly);

  // Velocity in orbital plane.
  const velocityScaleFactor = sqrt(
    G * (parent ? parent.massKg : sunMass) / semiMajorAxisM,
  ) / distance;
  const vxOrbital = -velocityScaleFactor * sin(eccentricAnomaly);
  const vyOrbital = velocityScaleFactor * sqrt(1 - eccentricity ** 2) * cos(eccentricAnomaly);

  // Convert to 3D coordinates.
  const cosAscendingNode = cos(ascendingNode);
  const sinAscendingNode = sin(ascendingNode);
  const cosInclination = cos(inclination);
  const sinInclination = sin(inclination);
  const cosArgPeriapsis = cos(argPeriapsis);
  const sinArgPeriapsis = sin(argPeriapsis);

  const position = new THREE.Vector3(
    (cosAscendingNode * cosArgPeriapsis - sinAscendingNode * sinArgPeriapsis * cosInclination) * xOrbital +
    (-cosAscendingNode * sinArgPeriapsis - sinAscendingNode * cosArgPeriapsis * cosInclination) * yOrbital,
    (sinAscendingNode * cosArgPeriapsis + cosAscendingNode * sinArgPeriapsis * cosInclination) * xOrbital +
    (-sinAscendingNode * sinArgPeriapsis + cosAscendingNode * cosArgPeriapsis * cosInclination) * yOrbital,
    (sinInclination * sinArgPeriapsis) * xOrbital + (sinInclination * cosArgPeriapsis) * yOrbital,
  );

  const velocity = new THREE.Vector3(
    (cosAscendingNode * cosArgPeriapsis - sinAscendingNode * sinArgPeriapsis * cosInclination) * vxOrbital +
    (-cosAscendingNode * sinArgPeriapsis - sinAscendingNode * cosArgPeriapsis * cosInclination) * vyOrbital,
    (sinAscendingNode * cosArgPeriapsis + cosAscendingNode * sinArgPeriapsis * cosInclination) * vxOrbital +
    (-sinAscendingNode * sinArgPeriapsis + cosAscendingNode * cosArgPeriapsis * cosInclination) * vyOrbital,
    (sinInclination * sinArgPeriapsis) * vxOrbital + (sinInclination * cosArgPeriapsis) * vyOrbital,
  );

  if (parent) {
    position.add(parent.positionM);
    velocity.add(parent.velocity);
  }

  body.positionM.copy(position);
  body.velocity.copy(velocity);
}

export {
  stepKeplerOrbitalMotion,
};
