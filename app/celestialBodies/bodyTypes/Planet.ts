import {
  KnownGravitationalBodyTypes,
  LargeGravitationalSource,
} from '../LargeGravitationalSource';

class Planet extends LargeGravitationalSource {
  type: KnownGravitationalBodyTypes = 'Planet';
}

export {
  Planet,
};
