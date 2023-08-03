import * as THREE from 'three';
import fs from 'fs';
import { gameRuntime } from '../../../gameRuntime';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import { galaxyDust } from '../shaders/galaxyDust.glsl';
import AssetFinder from '../../../../local/AssetFinder';
import Unit from '../../../../local/Unit';
import { star } from '../shaders/star.glsl';
import { rotateAboutPoint, xAxis } from '../../../../local/mathUtils';

const unitFactor = 0.000001;
const parsecToMLy = Unit.parsecToLy * unitFactor;

export default class StarGenerator {
  public rng: FastDeterministicRandom;

  constructor({ solPosition }) {
    this.rng = new FastDeterministicRandom();
    // Chosen with: Math.floor(Math.random() * 16384)
    this.rng.seed = 8426;

    AssetFinder.getStarCatalog({
      name: 'bsc5p_3d_min',
      callback: (error, fileName, parentDir, extension) => {
        console.log({ error, fileName, parentDir, extension });
        if (error) {
          return console.error(error);
        }
        fs.readFile(`${parentDir}/${fileName}`, (error, data) => {
          if (error) {
            return console.error(error);
          }
          let stars;
          try {
            // @ts-ignore
            stars = JSON.parse(data);
          }
          catch (error) {
            return console.error(error);
          }

          gameRuntime.tracked.levelScene.getOnce((scene: THREE.Scene) => {
            this.setupStars(scene, stars, solPosition);
          });
        });
      }
    });

  }

  setupStars(scene: THREE.Scene, starObjects: any[], solPosition: THREE.Vector3) {
    console.log('solPosition:', solPosition);
    console.log('starPositions:', starObjects);

    // const solAdjusted = new THREE.Vector3(
    //   solPosition.x * unitFactor,
    //   solPosition.x * unitFactor,
    //   solPosition.x * unitFactor,
    // );

    const material = new THREE.ShaderMaterial({
      vertexShader: star.vertex,
      fragmentShader: star.fragment,
      transparent: true,
      uniforms: {
        // thinDust: { value: fogTexture },
      }
    });

    const bufferGeometry = new THREE.PlaneGeometry(0.00001, 0.00001);
    // const bufferGeometry = new THREE.PlaneGeometry(0.0001, 0.0001);
    // bufferGeometry.setAttribute('aDustType', new THREE.InstancedBufferAttribute(
    //   new Int32Array(dustTypes), 1)
    // );

    const instancedPlane = new THREE.InstancedMesh(
      bufferGeometry, material, starObjects.length,
    );



    const dummy = new THREE.Object3D();

    // The default catalog uses coordinates that result in an incorrect
    // rotation in Three.js. Create a rotated version.
    const pivotObject = new THREE.Object3D();
    const transferObject = new THREE.Object3D();
    // for (let i = 0, len = starObjects.length; i < len; i++) {
    //   rotationObject
    // }

    // Create instanced plane.
    for (let i = 0, len = starObjects.length; i < len; i++) {
      const {
        i: index, n: name, x, y, z, N: luminosity, K: color,
      } = starObjects[i];

      // Transform coords to match game scale.
      dummy.position.set(x * parsecToMLy, y * parsecToMLy, z * parsecToMLy);

      // Place the star in the vicinity of our solar system.
      dummy.position.add(solPosition);

      // The default catalog uses coordinates that result in an incorrect
      // rotation in Three.js. Correct the rotation.
      // rotateAboutPoint(dummy, solPosition, xAxis, Math.PI * 0.5, false);

      dummy.updateMatrix();
      instancedPlane.setMatrixAt(i, dummy.matrix);
    }
    // instancedPlane.position.copy(solPosition);
    instancedPlane.instanceMatrix.needsUpdate = true;

    console.log('instanced star plane:', instancedPlane);

    scene.add(instancedPlane);
  }

  addArm(parent: THREE.LineSegments) {
  }
}
