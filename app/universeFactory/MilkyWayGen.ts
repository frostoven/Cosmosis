import * as THREE from 'three';
import { createLoopedPointPattern, createSpiralArm } from './galaxyUtils';
import FastDeterministicRandom from '../random/FastDeterministicRandom';
import { createShaderMaterial, shader } from '../shaders';

// @ts-ignore - typescript gets very angry when it's a filthy peasant js
// function. Let's just ignore the fact that the function already has default
// fucking inline values for the 'missing' parameters it's complaining about.
// I'll rewrite the js as ts when its current structure is obsolete. I won't
// rewrite it just because of ill-conceived bureaucratic process.
const galaxyMaterial = createShaderMaterial({
  shader: shader.milkyWay,
});

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
    const spiralPoints1 = new THREE.Points(spiralGeometry1, galaxyMaterial);
    group.add(spiralPoints1);

    const arm2 = createSpiralArm({ count, rotation: 1.5, fastRngInstance });
    const spiralGeometry2 = new THREE.BufferGeometry().setFromPoints(arm2);
    const spiralPoints2 = new THREE.Points(spiralGeometry2, galaxyMaterial);
    group.add(spiralPoints2);

    const arm3 = createSpiralArm({ count, rotation: 3.14, fastRngInstance });
    const spiralGeometry3 = new THREE.BufferGeometry().setFromPoints(arm3);
    const spiralPoints3 = new THREE.Points(spiralGeometry3, galaxyMaterial);
    group.add(spiralPoints3);

    const arm4 = createSpiralArm({ count, rotation: 4.71, fastRngInstance });
    const spiralGeometry4 = new THREE.BufferGeometry().setFromPoints(arm4);
    const spiralPoints4 = new THREE.Points(spiralGeometry4, galaxyMaterial);
    group.add(spiralPoints4);

    return group;
  }
}
