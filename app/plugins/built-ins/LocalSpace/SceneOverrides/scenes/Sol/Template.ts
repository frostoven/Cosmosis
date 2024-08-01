import * as THREE from 'three';
import {
  LocalPlanet,
} from '../../../../../../celestialBodies/bodyTypes/LocalPlanet';
import { sunMass, earthMass } from './defs';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Template extends LocalPlanet {
  constructor() {
    const color = new THREE.Color(1.0, 0.9, 0.8);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.planet },
      objectSize: { value: 696_340_000 },
      intensity: { value: 60 },
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
        getGlowMaterial: () => farMaterial,
      },
    });
  }
}

export {
  Template,
};
