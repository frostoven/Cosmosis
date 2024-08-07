import * as THREE from 'three';
import {
  Star,
} from '../../../../../../celestialBodies/bodyTypes/Star';
import { sunMass } from './defs';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Sun extends Star {
  constructor() {
    const color = new THREE.Color(1.0, 0.87, 0.81);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.star },
      objectSize: { value: 696_340_000 },
      intensity: { value: 100 },
      luminosity: { value: 300_000_000 },
      scale: { value: -10.0 },
      invRadius: { value: 10.0 },
      invGlowRadius: { value: 8.0 },
      visibility: { value: 67 },
      // camRotation: { value: new THREE.Vector3() },

      debugValue1: { value: 0.1 },
      debugValue2: { value: 0.4 },
      debugValue3: { value: -0.5 },
      debugValue4: { value: 1.0 },
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
        getGlowMaterial: () => farMaterial,
      },
    });


    // @ts-ignore
    window.sun = { uniforms };
    // @ts-ignore
    window.sunBody = this;
  }
}

export {
  Sun,
};
