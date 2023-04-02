import { Vector3 } from 'three';
import { randFloatSpreadDt, randomBiasDt } from '../random/randomUtils';
import { xAxis, zAxis } from '../local/mathUtils';

// The functions in this file are used for galaxy generation. This means
// they're called in bursts of up to tens of millions of times. Dereferencing
// functions as done here offers a rather small performance improvement, but it
// compounds when called so many times in succession.
const pi = Math.PI;
const twoPi = pi * 2;
const sin = Math.sin;
const cos = Math.cos;
const exp = Math.exp;

/**
 * Generates a set of 3D points that are distributed in beautiful patterns
 * within a loop.
 *
 * Examples:
 * * const points = createLoopedPointPattern(500, 50, 10, 0.5, 1.5);   // original
 * * const points = createLoopedPointPattern(500, 50, 10, 100.5, 1.5); // orbit lines
 * * const points = createLoopedPointPattern(500, 50, 10, 10.5, 0.0);  // torus
 * * const points = createLoopedPointPattern(500, 50, 10, 1.5, 10.05); // flower orbit lines
 * @param numPoints
 * @param radius
 * @param height
 * @param armFactor
 * @param swirlFactor
 * @returns {*[]}
 */
function createLoopedPointPattern(numPoints, radius, height, armFactor, swirlFactor) {
  const points: Vector3[] = [];
  for (let i = 0; i < numPoints; i++) {
    const pointSeed = i / numPoints;
    const angle = pointSeed * twoPi;
    const armSeed = pointSeed;
    const swirlSeed = pointSeed;
    const armOffset = armFactor * armSeed * twoPi;
    const swirlOffset = swirlFactor * swirlSeed * twoPi;
    const armAngle = angle + armOffset;
    const swirlAngle = angle + swirlOffset;
    const radialDistance = radius + height * sin(swirlAngle);
    const x = cos(armAngle) * radialDistance;
    const y = sin(armAngle) * radialDistance;
    const z = height * cos(swirlAngle);
    points.push(new Vector3(x, y, z));
  }
  return points;
}

/**
 * Generates 3D points along a spiral shape.
 * @param count
 * @param growthRate
 * @param radius
 * @param angleFactor
 * @param angleOffset
 * @param rotation
 */
function createSpiralArm({
  count, growthRate = 0.2, radius = 6, angleFactor = 2.0, angleOffset = 0,
  rotation = 0, fastRngInstance,
}) {
  const rng = fastRngInstance;
  const points: Vector3[] = [];
  // helixAngle = 2; // make it 10 for a good time.
  for (let i = 0; i < count; i++) {
    const theta = (i * pi * angleFactor / count) + angleOffset;
    const radialDistance = radius * exp(growthRate * theta) * 5;

    const x = (radialDistance * sin(theta)) + randFloatSpreadDt(25, rng) * randomBiasDt(-1, 1, 2, 1, rng);
    const y = (radialDistance * cos(theta)) + randFloatSpreadDt(25, rng) * randomBiasDt(-1, 1, 2, 1, rng);
    // const z = randFloatSpread(10000); // tunnel
    const z = randFloatSpreadDt(10, rng) * randomBiasDt(-0.3, 0.3, 0, 1, rng) * 5;

    const spiralPoint = new Vector3(x, y, z);

    // Apply rotation to the spiral point.
    spiralPoint.applyAxisAngle(zAxis, rotation);
    spiralPoint.applyAxisAngle(xAxis, Math.PI / 2);

    points.push(spiralPoint);
  }
  return points;
}

export {
  createLoopedPointPattern,
  createSpiralArm,
}
