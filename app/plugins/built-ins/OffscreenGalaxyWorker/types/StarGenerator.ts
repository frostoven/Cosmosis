import * as THREE from 'three';
import fs from 'fs';
import { gameRuntime } from '../../../gameRuntime';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import { galaxyDust } from '../shaders/galaxyDust.glsl';
import AssetFinder from '../../../../local/AssetFinder';
import Unit from '../../../../local/Unit';
import { star } from '../shaders/star.glsl';
import { rotateAboutPoint, xAxis } from '../../../../local/mathUtils';
import { Vector3 } from 'three';

const unitFactor = 0.000001;
const parsecToMLy = Unit.parsecToLy * unitFactor;
const pi = Math.PI;
const floor = Math.floor;

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

  // This is a fast (O(n)) proximity checker. It's used to ensure we don't
  // render all the stars in a binary (or triple) system while they're far
  // away. We do this because, to my knowledge, there's no way to render
  // close-proximity stars in a way that's both glitch-free and performant.
  // Note that this function wastes a lot of RAM, so its cache needs to be
  // cleared with clearBinaryCache once the load process is complete.<br><br>
  //
  // Returns true if there's already another star to be rendered less than 3.26
  // light years away, false if not.
  checkIfBinary(x, y, z) {
    [x, y, z] = [floor(x), floor(y), floor(z)];
    const cache = this._binaryCheckCache;

    const xHit = cache[x];
    const yHit = xHit && cache[x][y];
    const zHit = yHit && cache[x][y][z];

    if (!xHit) cache[x] = {};
    if (!yHit) cache[x][y] = {};
    if (!zHit) cache[x][y][z] = true;

    return xHit && yHit && zHit;
  }

  // Frees RAM used to check star proximity.
  clearBinaryCache() {
    this._binaryCheckCache = {};
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
        unitFactor: { value: unitFactor },
        generalEvenness: { value: 1.0 },
        falloffSensitivity: { value: 100000.0 },
        nearStarLumMultiplier: { value: 2.0 },
        nearFarRatio: { value: 100.0 },
      }
    });

    const visibleStars: any[] = [];

    // Prevent binary star glitches by trimming out near-proximity stars. I'd
    // have preferred combining this with the for loop after this one, but we
    // need to have a total size before can create and loop the instanced
    // plane.
    for (let i = 0, len = starObjects.length; i < len; i++) {
      const { x, y, z } = starObjects[i];
      const isBinary = this.checkIfBinary(x, y, z);
      if (!isBinary) {
        visibleStars.push(starObjects[i]);
      }
    }

    const bufferGeometry = new THREE.PlaneGeometry(unitFactor, unitFactor);
    // const bufferGeometry = new THREE.PlaneGeometry(0.0001, 0.0001);
    // const bufferGeometry = new THREE.PlaneGeometry(0.000000001, 0.000000001);

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
      // rotateAboutPoint(dummy, solPosition, xAxis, Math.PI * 0.5, false);

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
  }
}
