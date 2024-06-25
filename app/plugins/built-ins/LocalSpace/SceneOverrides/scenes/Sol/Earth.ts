import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass, earthMass } from './defs';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Earth extends LocalStar {
  constructor() {
    const color = new THREE.Color(0.529, 0.808, 0.922);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.planet },
      objectSize: { value: 6_371_000 },
      scale: { value: -10.0 },
      luminosity: { value: 30000 },
      invRadius: { value: 11.0 },
      invGlowRadius: { value: 5.0 },
      visibility: { value: 100 },
      intensity: { value: 60 },
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
    // window.planet = { uniforms };

    super({
      name: 'Earth',
      massKg: earthMass,
      radiusM: 6_371_000,
      rotationPeriodS: 24 * 3600,
      axialTilt: 23.44 * DEG2RAD,
      orbitalElements: {
        semiMajorAxisM: 149.60e9,
        eccentricity: 0.0167,
        inclination: 0.00005 * DEG2RAD,
        argPeriapsis: 114.20783 * DEG2RAD,
        ascendingNode: -11.26064 * DEG2RAD,
        meanAnomaly: 358.617 * DEG2RAD,
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
  Earth,
};
