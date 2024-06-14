import * as THREE from 'three';
import { LargeGravitationalSource } from '../LargeGravitationalSource';

// --- ✀ Constants ---------------------------------------------- //

// Gravitational constant.
const G = 6.67430e-11;
// Speed of light in m/s.
const c = 299792458;

// Constants for the Yoshida 4th-order sympathetic integrator.
const W0 = 1.0 / (2.0 - Math.pow(2.0, 1.0 / 3.0));
const W1 = 1.0 - 2.0 * W0;

// If true, loosely approximates general relativity (gets pretty close). We
// do it loosely instead of fully because actual GM is both extremely
// CPU-intensive and complex.
const applyRelativisticCorrection = true;

// --- ✀ Functions ---------------------------------------------- //

/**
 * #### Yoshida 4th-order sympathetic integrator
 * Computes interactions between gravitational bodies. Initial calcs done
 * Newton's laws of gravity, and then applies relativistic corrections
 * (first-order approximation).
 *
 * This integrator provides a higher-order approximation while maintaining the
 * symplectic property, which is crucial for conserving energy over long
 * simulations. It deals well with high error rates, though is not immune to
 * them.
 *
 * @param bodies
 * @param deltaTime
 */
function stepYoshidaGmIntegrator(bodies: LargeGravitationalSource, deltaTime: number) {
  const step1 = W0 * deltaTime;
  const step2 = W1 * deltaTime;

  updatePosition(bodies, step1 / 2);
  updateVelocity(bodies, step1);
  updatePosition(bodies, (step1 + step2) / 2);
  updateVelocity(bodies, step2);
  updatePosition(bodies, (step1 + step2) / 2);
  updateVelocity(bodies, step1);
  updatePosition(bodies, step1 / 2);

  // // Update mesh positions.
  // for (let i = 0, len = bodies.length; i < len; i++) {
  //   const body = bodies[i];
  //   body.mesh.position.copy(body.position);
  // }
}

function computeGravitationalForce(body1, body2) {
  const distanceVector = new THREE.Vector3().subVectors(body2.position, body1.position);
  const distance = distanceVector.length();

  // Newtonian gravitational force.
  const forceMagnitude = (G * body1.mass * body2.mass) / (distance * distance);
  if (!applyRelativisticCorrection) {
    return distanceVector.normalize().multiplyScalar(forceMagnitude);
  }

  // Relativistic correction (first-order approximation).
  const velocity1Squared = body1.velocity.lengthSq();
  const velocity2Squared = body2.velocity.lengthSq();
  const correctionFactor = 1 + (3 * (velocity1Squared + velocity2Squared) / (2 * c * c));

  return distanceVector.normalize().multiplyScalar(forceMagnitude * correctionFactor);
}

function updateAcceleration(bodies) {
  for (let a = 0, len = bodies.length; a < len; a++) {
    const totalForce = new THREE.Vector3();
    const body = bodies[a];
    for (let b = 0, len = bodies.length; b < len; b++) {
      const otherBody = bodies[b];
      if (body !== otherBody) {
        totalForce.add(computeGravitationalForce(body, otherBody));
      }
    }
    body.acceleration = totalForce.divideScalar(body.mass);
  }
}

function updatePosition(bodies, step) {
  for (let i = 0, len = bodies.length; i < len; i++) {
    const body = bodies[i];
    body.position.add(body.velocity.clone().multiplyScalar(step));
  }
}

function updateVelocity(bodies, step) {
  updateAcceleration(bodies);
  for (let i = 0, len = bodies.length; i < len; i++) {
    const body = bodies[i];
    body.velocity.add(body.acceleration.clone().multiplyScalar(step));
  }
}

export {
  stepYoshidaGmIntegrator,
};
