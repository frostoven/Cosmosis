import {
  KnownGravitationalBodyTypes,
  LargeGravitationalSource,
} from '../LargeGravitationalSource';

/**
 * This represents a nearby star, usually within the current planetary system.
 *
 * For very distant stars, see the OffscreenGalaxyWorker plugin.
 */
class Star extends LargeGravitationalSource {
  type: KnownGravitationalBodyTypes = 'Star';
}

export {
  Star,
};
