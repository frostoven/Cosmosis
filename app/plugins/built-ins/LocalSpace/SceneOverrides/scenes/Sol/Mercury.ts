import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass, earthMass } from './defs';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Mercury extends LocalStar {
  constructor() {
    const color = new THREE.Color(1.0, 1.0, 1.0);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.planet },
      objectSize: { value: 2_439_700 },
      intensity: { value: 10 },
      luminosity: { value: 1 },
      scale: { value: -1000 },
      invRadius: { value: 42 },
      invGlowRadius: { value: 5 },
      visibility: { value: 100 },
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
        getGlowMaterial: () => farMaterial,
      },
    });
  }
}

export {
  Mercury,
};
