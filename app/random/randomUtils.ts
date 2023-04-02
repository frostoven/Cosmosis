import FastDeterministicRandom from './FastDeterministicRandom';

const random = Math.random;
const ceil = Math.ceil;
const floor = Math.floor;

/**
 * This example returns a random number between the specified values. The
 * returned value is no lower than (and may possibly equal) min, and is less
 * than (and not equal) max.
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * @param {number} min
 * @param {number} max
 */
function randomFloat(min, max) {
  return random() * (max - min) + min;
}

/**
 * Like randomFloat, but deterministic.
 * @param {number} min
 * @param {number} max
 * @param {FastDeterministicRandom} fastRngInstance
 */
function randomFloatDt(min, max, fastRngInstance: FastDeterministicRandom) {
  return fastRngInstance.next() * (max - min) + min;
}

/**
 * This example returns a random integer between the specified values. The
 * value is no lower than min (or the next integer greater than min if min
 * isn't an integer), and is less than (but not equal to) max.
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * @param {number} min
 * @param {number} max
 */
function randomIntExcl(min, max) {
  min = ceil(min);
  max = floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return floor(random() * (max - min) + min);
}

/**
 * Like randomIntExcl, but deterministic.
 * @param {number} min
 * @param {number} max
 * @param {FastDeterministicRandom} fastRngInstance
 */
function randomIntExclDt(min, max, fastRngInstance: FastDeterministicRandom) {
  min = ceil(min);
  max = floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return floor(fastRngInstance.next() * (max - min) + min);
}

/**
 * While the getRandomInt() function above is inclusive at the minimum, it's exclusive at
 * the maximum. What if you need the results to be inclusive at both the
 * minimum and the maximum? The getRandomIntInclusive() function below
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * accomplishes that.
 * @param {number} min
 * @param {number} max
 */
function randomInt(min, max) {
  // TODO: compare performance to crypto randomInt. If crypto is faster, create
  //  a webpack setup that dynamically uses that instead of this function when
  //  available.
  min = ceil(min);
  max = floor(max);
  // The maximum is inclusive and the minimum is inclusive
  return floor(random() * (max - min + 1) + min);
}

/**
 * Like randomInt, but deterministic.
 * @param {number} min
 * @param {number} max
 * @param {FastDeterministicRandom} fastRngInstance
 */
function randomIntDt(min, max, fastRngInstance: FastDeterministicRandom) {
  min = ceil(min);
  max = floor(max);
  // The maximum is inclusive and the minimum is inclusive
  return floor(fastRngInstance.next() * (max - min + 1) + min);
}

/**
 * Generates a number
 * @param {number} min
 * @param {number} max
 * @param {number} bias
 * @param {number} influence
 * @param {FastDeterministicRandom} fastRngInstance
 */
function randomBias(min, max, bias, influence) {
  // Get number in range.
  const value = randomFloat(min, max);
  // Create influence.
  influence *= random();
  // Apply bias based on influence.
  return value * (1 - influence) + bias * influence;
}

/**
 * Like randomBias, but deterministic.
 * @param {number} min
 * @param {number} max
 * @param {number} bias
 * @param {number} influence
 * @param {FastDeterministicRandom} fastRngInstance
 */
function randomBiasDt(min, max, bias, influence, fastRngInstance: FastDeterministicRandom) {
  // Get number in range.
  const value = randomFloatDt(min, max, fastRngInstance);
  // Create influence.
  influence *= fastRngInstance.next();
  // Apply bias based on influence.
  return value * (1 - influence) + bias * influence;
}

// Taken from Three.js, but modified to use FastDeterministicRandom.
function randFloatSpreadDt(range, fastRngInstance: FastDeterministicRandom) {
  return range * (0.5 - fastRngInstance.next());
}

export {
  randomFloat,
  randomFloatDt,
  randomIntExcl,
  randomIntExclDt,
  randomInt,
  randomIntDt,
  randomBias,
  randomBiasDt,
  randFloatSpreadDt,
}
