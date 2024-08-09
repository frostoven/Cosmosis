import * as THREE from 'three';
import {
  Planet,
} from '../../../../../../celestialBodies/bodyTypes/Planet';
import { earthMass } from './defs';
import { MeshBasicMaterial, ShaderMaterial } from 'three';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;
const textureLoader = new THREE.TextureLoader();

function buildMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      planetColor: { value: new THREE.Color(0x00FF00) },
      planetLuminosity: { value: 10.0 },
      planetTexture: { value: [] },
    },
    vertexShader: localBody.vertex,
    fragmentShader: localBody.fragment,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
}

// https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html
class Saturn extends Planet {
  constructor() {
    // const color = new THREE.Color(1.0, 0.667, 0.333);
    const color = new THREE.Color(1.0, 0.0, 0.9);
    let nearMaterial: ShaderMaterial | MeshBasicMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.planet },
      objectSize: { value: 58_232_000 * 100 },
      intensity: { value: 70 },
      luminosity: { value: 1 },
      scale: { value: -1000 },
      invRadius: { value: 42 },
      invGlowRadius: { value: 5 },
      visibility: { value: 200 },
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
    window.Saturn = { uniforms };


    super({
      name: 'Saturn',
      massKg: earthMass * 95.16,
      radiusM: 58_232_000,
      rotationPeriodS: 10.656 * 3600,
      axialTilt: 26.73 * DEG2RAD,
      orbitalElements: {
        semiMajorAxisM: 1433.53e9,
        eccentricity: 0.0542,
        inclination: 2.48524 * DEG2RAD,
        argPeriapsis: 339.392 * DEG2RAD,
        ascendingNode: 113.665 * DEG2RAD,
        meanAnomaly: 317.020 * DEG2RAD,
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
  Saturn,
};
