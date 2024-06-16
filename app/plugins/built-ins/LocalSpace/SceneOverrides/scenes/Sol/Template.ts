import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass, earthMass } from './defs';
import { localBody } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Template extends LocalStar {
  constructor() {
    const nearMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    const uniforms = {
      objectSize: { value: 696_340_000 },
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
      name: 'Template',
      massKg: 1000000,
      radiusM: 6_000_000,
      rotationPeriodS: 1000000,
      axialTilt: 1000000,
      orbitalElements: {
        semiMajorAxisM: 1000000,
        eccentricity: 1000000,
        inclination: 1000000,
        argPeriapsis: 1000000,
        ascendingNode: 1000000,
        meanAnomaly: 1000000,
        referenceTime: 1000000,
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
  Template,
};
