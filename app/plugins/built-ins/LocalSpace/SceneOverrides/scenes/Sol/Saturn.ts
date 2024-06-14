import * as THREE from 'three';
import {
  LocalPlanet,
} from '../../../../../../celestialBodies/bodyTypes/LocalPlanet';
import { earthMass } from './defs';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

// https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html
class Saturn extends LocalPlanet {
  constructor() {
    const material = new THREE.MeshBasicMaterial({ color: 0xffaa55 });

    super({
      name: 'Saturn',
      massKg: earthMass * 95.16,
      radiusM: 58_232_000,
      rotationPeriodS: 10.656 * 3600,
      axialTilt: 26.73 * DEG2RAD,
      orbitalElements: {
        semiMajorAxisM: 1433.53e9,
        eccentricity: 0.0542,
        inclination: 2.48524 * DEG2RAD,
        argPeriapsis: 339.392 * DEG2RAD,
        ascendingNode: 113.665 * DEG2RAD,
        meanAnomaly: 317.020 * DEG2RAD,
        referenceTime: 0,
      },
      visuals: {
        getTexture: () => null,
        getMaterial: () => material,
      }
    });
  }
}

export {
  Saturn,
};
