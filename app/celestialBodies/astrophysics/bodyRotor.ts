import * as THREE from 'three';
import { LargeGravitationalSource } from '../LargeGravitationalSource';

const { PI: pi } = Math;

function stepBodyRotation(
  body: LargeGravitationalSource, mesh: THREE.Object3D, t: number,
) {
  // Rotational angle.
  mesh.rotation.y = (t % body.rotationPeriodS) / body.rotationPeriodS * 2 * pi;
  // Axial tilt.
  mesh.rotation.x = body.axialTilt;
}

// function stepBodyRotations(bodies, t) {
//   for (let i = 0, len = bodies.length; i < len; i++) {
//     const body = bodies[i];
//     if (body.rotationPeriod) {
//       stepBodyRotation(body, t);
//     }
//   }
// }

export {
  stepBodyRotation,
  // stepBodyRotations,
};
