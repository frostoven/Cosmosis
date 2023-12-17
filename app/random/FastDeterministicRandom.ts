import {
  deterministicLookupTable,
  lookupTableLength,
} from './deterministicLookupTable';
import { randomInt } from './randomUtils';

/**
 * Produces deterministic random numbers by using a lookup table of precomputed
 * random values.
 *
 * Full docs over at:
 * https://xkcd.com/221/
 */
export default class FastDeterministicRandom {
  private _index: number;
  private _customSeed: number;

  static _staticRandomIndex = randomInt(0, lookupTableLength);
  private readonly _interceptMapRandom: { [key: string]: Function[] };
  private readonly _interceptMapValue: { [key: string]: Function[] };

  constructor(randomizeIndex = false) {
    // TODO: perf-test this with a 0 | 0 and see if there's a measurable
    //  difference.
    this._index = 0;
    this._customSeed = 0;

    this._interceptMapRandom = {};
    this._interceptMapValue = {};
    if (randomizeIndex) {
      this.randomizeIndex();
    }
  }

  get seed() {
    return this._index;
  }

  set seed(value) {
    if (value >= lookupTableLength) {
      const newValue = value % lookupTableLength;
      console.warn(
        `[FastDeterministicRandom] '${value}' out of bounds ` +
        `(max: ${lookupTableLength - 1}). Overflowing to ${newValue}.`
      );
      value = newValue;
    }
    this._index = this._customSeed = value;
  }

  reset() {
    this._index = this._customSeed;
  }

  /**
   * By default, this class will start at the beginning of the pre-generated
   * random table and work its way to the end. This function randomly places
   * that index somewhere in the middle using Math.random()).
   */
  randomizeIndex() {
    this._index = randomInt(0, lookupTableLength);
  }

  /**
   * Returns a fake random number from a lookup table.
   */
  next() {
    if (++this._index === lookupTableLength) {
      this._index = 0;
    }

    return deterministicLookupTable[this._index];
  }

  /**
   * Meant to be used with interceptRandom(). Otherwise, acts like next().
   */
  nextInterceptable() {
    if (++this._index === lookupTableLength) {
      this._index = 0;
    }

    let callbacks = this._interceptMapRandom[this._index];
    if (callbacks?.length) {
      return callbacks[0]();
    }

    callbacks = this._interceptMapValue[this._index];
    if (callbacks?.length) {
      return callbacks[0]();
    }
  }

  /**
   * Intercepts a specific lookup index when nextInterceptable() is called.
   * This allows you to conditionally return a specific value when a random
   * value is expected.
   */
  interceptRandom(index, callback) {
    if (!this._interceptMapRandom[index]) {
      this._interceptMapRandom[index] = [];
    }
    else {
      console.warn(`interceptRandom[${index}] already has an interceptor.`);
    }

    this._interceptMapRandom[index].push(callback);
  }

  /**
   * Intercepts a specific lookup result when nextInterceptable() is called.
   * This allows you to conditionally return a specific value when a random
   * value is expected.
   */
  interceptValue(rngValue, callback) {
    if (!this._interceptMapRandom[rngValue]) {
      this._interceptMapRandom[rngValue] = [];
    }
    else {
      console.warn(`interceptValue ${rngValue} already has an interceptor.`);
    }

    this._interceptMapRandom[rngValue].push(callback);
  }

  /**
   * Returns a fake random number from a lookup table, but does not move to the
   * next value. This is guaranteed to return the same value forever so long as
   * next() isn't called.
   */
  previewNext() {
    let nextIndex = this._index + 1;
    if (nextIndex === lookupTableLength) {
      nextIndex = 0;
    }

    return deterministicLookupTable[nextIndex];
  }

  /**
   * Returns a fake random number from a lookup table. It's called bad because,
   * being static, it can rapidly return the same values twice if a lot of
   * processes call this function.
   */
  static bad() {
    if (++FastDeterministicRandom._staticRandomIndex === lookupTableLength) {
      FastDeterministicRandom._staticRandomIndex = 0;
    }

    return deterministicLookupTable[FastDeterministicRandom._staticRandomIndex];
  }
};
