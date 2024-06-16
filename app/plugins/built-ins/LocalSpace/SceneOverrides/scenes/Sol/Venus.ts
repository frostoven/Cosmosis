import * as THREE from 'three';
import {
  LocalStar,
} from '../../../../../../celestialBodies/bodyTypes/LocalStar';
import { sunMass, earthMass } from './defs';
import { localBody } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Venus extends LocalStar {
  constructor() {
    const nearMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const uniforms = {
      objectSize: { value: 6_051_800 },
      scale: { value: -10.0 },
      luminosity: { value: 1 },
      invRadius: { value: 10.0 },
      invGlowRadius: { value: 8.0 },
      visibility: { value: 67 },
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
        getDistantMaterial: () => farMaterial,
      },
    });
  }
}

export {
  Venus,
};
