import * as THREE from 'three';
import {
  LocalPlanet,
} from '../../../../../../celestialBodies/bodyTypes/LocalPlanet';
import { earthMass } from './defs';
import { nearbyPlanet } from '../../../shaders/nearbyPlanet.glsl';
import { MeshBasicMaterial, ShaderMaterial } from 'three';
import { localBody } from '../../../shaders/localBody.glsl';

const DEG2RAD = THREE.MathUtils.DEG2RAD;
const textureLoader = new THREE.TextureLoader();

function buildMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      planetColor: { value: new THREE.Color(0x00FF00) },
      planetLuminosity: { value: 10.0 },
      planetTexture: { value: [] },
    },
    vertexShader: nearbyPlanet.vertex,
    fragmentShader: nearbyPlanet.fragment,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
}

// https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html
class Saturn extends LocalPlanet {
  constructor() {
    let nearMaterial: ShaderMaterial | MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa55
    });

    const uniforms = {
      objectSize: { value: 58_232_000 },
      scale: { value: -10.0 },
      luminosity: { value: 30000 },
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
        getDistantMaterial: () => farMaterial,
      },
    });
  }
}

export {
  Saturn,
};
