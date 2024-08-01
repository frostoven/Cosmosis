import * as THREE from 'three';
import {
  LocalPlanet,
} from '../../../../../../celestialBodies/bodyTypes/LocalPlanet';
import { sunMass, earthMass } from './defs';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Venus extends LocalPlanet {
  constructor() {
    const color = new THREE.Color(1.0, 0.565, 0.15);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.planet },
      objectSize: { value: 6_051_800 },
      intensity: { value: 60 },
      luminosity: { value: 1 },
      scale: { value: -28 },
      invRadius: { value: 31 },
      invGlowRadius: { value: 4 },
      visibility: { value: 174 },
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
    window.planet = { uniforms };

    super({
      name: 'Venus',
      massKg: earthMass * 0.815,
      radiusM: 6_051_800,
      rotationPeriodS: -243.025 * 24 * 3600, // Retrograde
      axialTilt: 177.36 * DEG2RAD, // Retrograde
      orbitalElements: {
        semiMajorAxisM: 108.21e9,
        eccentricity: 0.0067,
        inclination: 3.39471 * DEG2RAD,
        argPeriapsis: 54.852 * DEG2RAD,
        ascendingNode: 76.680 * DEG2RAD,
        meanAnomaly: 50.115 * DEG2RAD,
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
  Venus,
};
