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

  static _staticRandomIndex = randomInt(0, lookupTableLength);

  constructor(randomizeIndex = false) {
    // TODO: perf-test this with a 0 | 0 and see if there's a measurable
    //  difference.
    this._index = 0;
    if (randomizeIndex) {
      this.randomizeIndex();
    }
  }

  reset() {
    this._index = 0;
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
