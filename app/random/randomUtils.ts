/**
 * This example returns a random number between the specified values. The
 * returned value is no lower than (and may possibly equal) min, and is less
 * than (and not equal) max.
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * @param min
 * @param max
 */
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * This example returns a random integer between the specified values. The
 * value is no lower than min (or the next integer greater than min if min
 * isn't an integer), and is less than (but not equal to) max.
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * @param min
 * @param max
 */
function randomIntExcl(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * While the getRandomInt() function above is inclusive at the minimum, it's exclusive at
 * the maximum. What if you need the results to be inclusive at both the
 * minimum and the maximum? The getRandomIntInclusive() function below
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * accomplishes that.
 * @param min
 * @param max
 */
function randomInt(min, max) {
  // TODO: compare performance to crypto randomInt. If crypto is faster, create
  //  a webpack setup that dynamically uses that instead of this function when
  //  available.
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is inclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export {
  randomFloat,
  randomIntExcl,
  randomInt,
}
