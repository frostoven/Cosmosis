import * as THREE from 'three';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';
import { Earth } from './Earth';
import { Moon } from '../../../../../../celestialBodies/bodyTypes/Moon';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class EarthLuna extends Moon {
  constructor(earth: Earth) {
    const color = new THREE.Color(1.0, 1.0, 1.0);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.moon },
      objectSize: { value: 1_737_400 },
      intensity: { value: 0.1 },
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
      name: 'Luna',
      massKg: 7.342e22,
      parentPlanet: earth,
      radiusM: 1_737_400,
      rotationPeriodS: 27.32 * 24 * 3600,
      axialTilt: 1.54 * DEG2RAD,
      orbitalElements: {
        semiMajorAxisM: 384400e3,
        eccentricity: 0.0549,
        inclination: 5.145 * DEG2RAD,
        argPeriapsis: 318.15 * DEG2RAD,
        ascendingNode: 125.08 * DEG2RAD,
        meanAnomaly: 115.3654 * DEG2RAD,
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
  EarthLuna,
};
