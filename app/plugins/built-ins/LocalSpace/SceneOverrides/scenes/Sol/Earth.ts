import * as THREE from 'three';
import {
  LocalPlanet,
} from '../../../../../../celestialBodies/bodyTypes/LocalPlanet';
import { earthMass } from './defs';
import { localBody, LocalBodyGlslType } from '../../../shaders/localBody.glsl';
import { gameRuntime } from '../../../../../gameRuntime';

const DEG2RAD = THREE.MathUtils.DEG2RAD;

class Earth extends LocalPlanet {
  constructor() {
    const color = new THREE.Color(0.529, 0.808, 0.922);
    const nearMaterial = new THREE.MeshBasicMaterial({ color });

    const uniforms = {
      color: { value: color },
      bodyType: { value: LocalBodyGlslType.planet },
      objectSize: { value: 6_371_000 },
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
      depthTest: false,
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
        getGlowMaterial: () => farMaterial,
      },
    });

    // TODO: Remove me. Here for testing purposes only.
    setTimeout(() => {
      const v3 = new THREE.Vector3();
      this.sphereMesh.getWorldPosition(v3);
      v3.x -= 100_000_000;
      console.log(v3);
      gameRuntime.tracked.spacetimeControl.cachedValue.teleportShipToLocalLocation(
        v3,
        // new THREE.Vector3(0, 0, -2_500_000_000), // toasty
        // new THREE.Vector3(0, 0, -29_798_550_000), // very close
        // new THREE.Vector3(41_000_480_000, -99_306_919_000, -4_480_215_000), // audience before venus
        // new THREE.Vector3(-30_571_314_000, 149_289_075_000, -96_640_330), // nature planet
        // new THREE.Vector3(-32_349_676_000, 528_630_200, 148_201_550_000), // nature planet ROTATED
        // new THREE.Vector3(0, 0,   -107_620_000_700), // venus's distance to the sun.
        // new THREE.Vector3(0, 0,   -149_597_870_700), // earth's distance to the sun.
        // new THREE.Vector3(0, 0,   -4_377_110_000), // the glitch zone.
        // new THREE.Vector3(0, 0, -1_448_400_000_000), // saturn's distance.
      );
    }, 2500);
  }
}

export {
  Earth,
};
