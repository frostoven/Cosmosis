import * as THREE from 'three';
import fs from 'fs';
import { gameRuntime } from '../../../gameRuntime';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import { galaxyDust } from '../shaders/galaxyDust.glsl';
import AssetFinder from '../../../../local/AssetFinder';
import Unit from '../../../../local/Unit';
import { star } from '../shaders/star.glsl';
import {
  rotateAboutPoint,
  xAxis,
  yAxis,
  zAxis,
} from '../../../../local/mathUtils';

const unitFactor = 0.00001;
const parsecToMLy = Unit.parsecToLy * unitFactor;
const pi = Math.PI;
const floor = Math.floor;
const equatorialTilt = 23.44 * THREE.MathUtils.DEG2RAD;

export default class StarGenerator {
  public rng: FastDeterministicRandom;

  private _binaryCheckCache: {};

  constructor({ solPosition }) {
    this.rng = new FastDeterministicRandom();
    // Chosen with: Math.floor(Math.random() * 16384)
    this.rng.seed = 8426;

    this._binaryCheckCache = {};

    AssetFinder.getStarCatalog({
      name: 'bsc5p_3d_min',
      // name: 'constellation_test',
      // name: 'bubble_min',
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

  // Frees RAM used to check star proximity.
  clearBinaryCache() {
    this._binaryCheckCache = {};
  }

  setupStars(scene: THREE.Scene, starObjects: any[], solPosition: THREE.Vector3) {
    console.log('solPosition:', solPosition);
    console.log('starPositions:', starObjects);

    const material = new THREE.ShaderMaterial({
      vertexShader: star.vertex,
      fragmentShader: star.fragment,
      transparent: true,
      uniforms: {
        scale: { value: -500.0 },
        invRadius: { value: 100.0 },
        invGlowRadius: { value: 3.0 },
      }
    });

    const visibleStars: any[] = [];

    // Prevent binary star glitches by trimming out near-proximity stars. I'd
    // have preferred combining this with the for loop after this one, but we
    // need to have a total size before can create and loop the instanced
    // plane.
    for (let i = 0, len = starObjects.length; i < len; i++) {
      const starObject = starObjects[i];
      visibleStars.push(starObject);
    }

    const bufferGeometry = new THREE.PlaneGeometry(unitFactor, unitFactor);

    const instancedPlane = new THREE.InstancedMesh(
      bufferGeometry, material, visibleStars.length,
    );

    const dummy = new THREE.Object3D();

    // The default catalog uses coordinates that result in an incorrect
    // rotation in Three.js. Create a rotated version.
    const pivotObject = new THREE.Object3D();
    const transferObject = new THREE.Object3D();

    const colors: number[] = [];
    const luminosities: number[] = [];

    // Create instanced plane.
    for (let i = 0, len = visibleStars.length; i < len; i++) {
      const {
        i: index, n: name, x, y, z, N: luminosity, K: color,
      } = visibleStars[i];

      if (color) {
        colors.push(color.r, color.g, color.b);
      }
      else {
        colors.push(1.0, 0.0, 0.0);
      }
      luminosities.push(luminosity);

      // Transform coords to match game scale.
      dummy.position.set(x * parsecToMLy, y * parsecToMLy, z * parsecToMLy);

      // Place the star in the vicinity of our solar system.
      dummy.position.add(solPosition);

      // The default catalog uses coordinates that result in an incorrect
      // rotation in Three.js. Correct the rotation.
      rotateAboutPoint(dummy, solPosition, yAxis, pi * -0.5, false);
      rotateAboutPoint(dummy, solPosition, xAxis, pi * -0.5 + equatorialTilt, false);
      rotateAboutPoint(dummy, solPosition, zAxis, pi * 0.25 + (equatorialTilt * 0.5), false);

      dummy.updateMatrix();
      instancedPlane.setMatrixAt(i, dummy.matrix);
    }
    this.clearBinaryCache();

    bufferGeometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(
      new Float32Array(colors), 3,
    ));
    bufferGeometry.setAttribute('aLuminosity', new THREE.InstancedBufferAttribute(
      new Float32Array(luminosities), 1,
    ));

    // instancedPlane.position.copy(solPosition);
    instancedPlane.instanceMatrix.needsUpdate = true;

    console.log('instanced star plane:', instancedPlane);

    scene.add(instancedPlane);

    // Galaxy center marker. Used to double-check star placement.
    // const size = 0.00125;
    // const geometry = new THREE.BoxGeometry(size, size * 64, size);
    // const material2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // const cube = new THREE.Mesh(geometry, material2);
    // scene.add(cube);
    window.debug.sol = solPosition;
    window.debug.uniforms = material.uniforms;
  }
}
