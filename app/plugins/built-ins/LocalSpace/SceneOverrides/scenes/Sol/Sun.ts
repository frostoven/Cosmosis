import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass } from './defs';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Sun extends LocalStar {
  constructor() {
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    super({
      name: 'Sun',
      massKg: sunMass,
      radiusM: 696_340_000,
      rotationPeriodS: 10.656 * 3600,
      axialTilt: 26.73 * DEG2RAD,
      orbitalElements: {
        // The Sun does wiggle a tiny bit due to the pull of especially the
        // larger planets, but it's very little so these values are close to
        // (or observationally indistinguishable from) zero.
        // TODO: Decide if we want this just skipped if close to zero.
        semiMajorAxisM: Number.EPSILON,
        eccentricity: 0.0001,
        inclination: 0.004 * DEG2RAD,
        argPeriapsis: Number.EPSILON,
        ascendingNode: Number.EPSILON,
        meanAnomaly: Number.EPSILON,
        referenceTime: Number.EPSILON,
      },
      visuals: {
        getTexture: () => null,
        getMaterial: () => material,
      },
    });
  }
}

export {
  Sun,
};
