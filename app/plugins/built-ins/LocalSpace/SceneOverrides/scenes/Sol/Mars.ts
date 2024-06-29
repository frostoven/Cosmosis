import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass, earthMass } from './defs';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Mars extends LocalStar {
  constructor() {
    const color = new THREE.Color(1.0, 0.0, 0.0);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.planet },
      objectSize: { value: 3_000_000 },
      intensity: { value: 50 },
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
      depthTest: false,
    });

    // @ts-ignore
    // window.planet = { uniforms };

    super({
      name: 'Mars',
      massKg: earthMass * 0.107,
      radiusM: 3_000_000,                 // TODO: Check me.
      rotationPeriodS: 24.6229 * 3600,
      axialTilt: 25.19 * DEG2RAD,
      orbitalElements: {
        semiMajorAxisM: 227.92e9,
        eccentricity: 0.0934,
        inclination: 1.85061 * DEG2RAD,
        argPeriapsis: 286.502 * DEG2RAD,
        ascendingNode: 49.558 * DEG2RAD,
        meanAnomaly: 19.412 * DEG2RAD,
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
  Mars,
};
