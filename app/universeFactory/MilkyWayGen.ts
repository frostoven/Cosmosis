import * as THREE from 'three';
import { createLoopedPointPattern, createSpiralArm } from './galaxyUtils';
import FastDeterministicRandom from '../random/FastDeterministicRandom';

export default class MilkyWayGen {
  public particlesPerArm: number;
  private readonly _fastRng: FastDeterministicRandom;

  constructor(particlesPerArm = 300000) {
    this._fastRng = new FastDeterministicRandom();
    this.particlesPerArm = particlesPerArm;
  }

  createGalaxy(includeOrbitLines = false): THREE.Group {
    const fastRngInstance = this._fastRng;
    const count = this.particlesPerArm;
    const group = new THREE.Group();
    const size = 0.0005; // particle size

    if (includeOrbitLines) {
      const points = createLoopedPointPattern(500, 50, 10, 100.5, 1.5);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
      const spiral = new THREE.Points(geometry, material);
      group.add(spiral);
    }

    const arm1 = createSpiralArm({ count, rotation: 0, fastRngInstance});
    const spiralGeometry1 = new THREE.BufferGeometry().setFromPoints(arm1);
    const spiralMaterial1 = new THREE.PointsMaterial({ size, color: 0x535049 });
    const spiralPoints1 = new THREE.Points(spiralGeometry1, spiralMaterial1);
    group.add(spiralPoints1);

    const arm2 = createSpiralArm({ count, rotation: 1.5, fastRngInstance });
    const spiralGeometry2 = new THREE.BufferGeometry().setFromPoints(arm2);
    const spiralMaterial2 = new THREE.PointsMaterial({ size, color: 0x33312a });
    const spiralPoints2 = new THREE.Points(spiralGeometry2, spiralMaterial2);
    group.add(spiralPoints2);

    const arm3 = createSpiralArm({ count, rotation: 3.14, fastRngInstance });
    const spiralGeometry3 = new THREE.BufferGeometry().setFromPoints(arm3);
    const spiralMaterial3 = new THREE.PointsMaterial({ size, color: 0x636963 });
    const spiralPoints3 = new THREE.Points(spiralGeometry3, spiralMaterial3);
    group.add(spiralPoints3);

    const arm4 = createSpiralArm({ count, rotation: 4.71, fastRngInstance });
    const spiralGeometry4 = new THREE.BufferGeometry().setFromPoints(arm4);
    const spiralMaterial4 = new THREE.PointsMaterial({ size, color: 0x2b3639 });
    const spiralPoints4 = new THREE.Points(spiralGeometry4, spiralMaterial4);
    group.add(spiralPoints4);

    return group;
  }
}
