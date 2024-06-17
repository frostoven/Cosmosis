import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass, earthMass } from './defs';
import { localBody } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Mercury extends LocalStar {
  constructor() {
    const color = new THREE.Color(1.0, 1.0, 1.0);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      objectSize: { value: 2_439_700 },
      scale: { value: -10.0 },
      luminosity: { value: 30000 },
      invRadius: { value: 10.0 },
      invGlowRadius: { value: 8.0 },
      visibility: { value: 67 },
      intensity: { value: 10 },
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

    super({
      name: 'Mercury',
      massKg: earthMass * 0.055,
      radiusM: 2_439_700,
      rotationPeriodS: 58.646 * 24 * 3600,
      axialTilt: 0.034 * DEG2RAD,
      orbitalElements: {
        semiMajorAxisM: 57.91e9,
        eccentricity: 0.2056,
        inclination: 7.00487 * DEG2RAD,
        argPeriapsis: 29.124 * DEG2RAD,
        ascendingNode: 48.331 * DEG2RAD,
        meanAnomaly: 174.796 * DEG2RAD,
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
  Mercury,
};
