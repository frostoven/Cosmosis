import {
  KnownGravitationalBodyTypes,
  LargeGravitationalSource,
} from '../LargeGravitationalSource';

class Moon extends LargeGravitationalSource {
  type: KnownGravitationalBodyTypes = 'Moon';
}

export {
  Moon,
};
