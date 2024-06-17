import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass } from './defs';
import { localBody } from '../../../shaders/localBody.glsl';
import { values } from 'lodash';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Sun extends LocalStar {
  constructor() {
    const color = new THREE.Color(1.0, 0.87, 0.81);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      objectSize: { value: 696_340_000 },
      scale: { value: -10.0 },
      luminosity: { value: 300000000 },
      invRadius: { value: 10.0 },
      invGlowRadius: { value: 8.0 },
      visibility: { value: 67 },
      intensity: { value: 100 },
    };

    const farMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: localBody.vertex,
      fragmentShader: localBody.fragment,
      // side: THREE.FrontSide,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    // @ts-ignore
    window.Sun = { uniforms };

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
        semiMajorAxisM: 0,
        eccentricity: 0.0001,
        inclination: 0.004 * DEG2RAD,
        argPeriapsis: 0,
        ascendingNode: 0,
        meanAnomaly: 0,
        referenceTime: 0,
      },
      visuals: {
        getTexture: () => null,
        getSphereMaterial: () => nearMaterial,
        getDistantMaterial: () => farMaterial,
      },
    });
  }
}

export {
  Sun,
};
