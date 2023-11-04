import * as THREE from 'three';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import Unit from '../../../../local/Unit';
import { star } from '../shaders/star.glsl';
import {
  rotateAboutPoint,
  xAxis,
  yAxis,
  zAxis,
} from '../../../../local/mathUtils';
import ChangeTracker from 'change-tracker/src';

const starSize = 0.5;
const unitFactor = 0.00001;
const parsecToMLy = Unit.parsecToLy * unitFactor;
const pi = Math.PI;
const equatorialTilt = 23.44 * THREE.MathUtils.DEG2RAD;

export default class StarGenerator {
  public rng: FastDeterministicRandom;
  private instancedPlane!: THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  public onStarGeneratorReady: ChangeTracker;
  private _visible: boolean;

  constructor({ solPosition, scene, stars }) {
    this.rng = new FastDeterministicRandom();
    // Chosen with: Math.floor(Math.random() * 16384)
    this.rng.seed = 8426;
    this.onStarGeneratorReady = new ChangeTracker();
    this._visible = true;
    this.setupStars(scene, stars, solPosition);
  }

  setupStars(scene: THREE.Scene, starObjects: any[], solPosition: THREE.Vector3) {
    const material = new THREE.ShaderMaterial({
      vertexShader: star.vertex,
      fragmentShader: star.fragment,
      transparent: true,
      uniforms: {
        scale: { value: -10.0 },
        invRadius: { value: 110.0 },
        invGlowRadius: { value: 2.0 },
        // 1: all stars visible. 0.25: industrial light pollution. 0: sunlight.
        visibility: { value: 1 },
      }
    });

    // Debugger hook:
    // window.material = material;

    // const visibleStars: any[] = [];
    // // TODO: move into GalaxyDB.
    // for (let i = 0, len = starObjects.length; i < len; i++) {
    //   const starObject = starObjects[i];
    //   visibleStars.push(starObject);
    // }
    const visibleStars: any[] = starObjects;

    const planeSize = starSize * unitFactor * 3;
    const bufferGeometry = new THREE.PlaneGeometry(planeSize, planeSize);

    const instancedPlane = new THREE.InstancedMesh(
      bufferGeometry, material, visibleStars.length,
    );

    const dummy = new THREE.Object3D();

    const colors: number[] = [];
    const luminosities: number[] = [];

    // Create instanced plane.
    for (let i = 0, len = visibleStars.length; i < len; i++) {
      if (i > 0 && i % 10000 === 0) {
        console.log('Stars still loading; now at', i);
      }

      // if (visibleStars[i] === null) {
      //   visibleStars[i] = {
      //     x: 0, y: 0, z: 0, N: Number.EPSILON, K: { r: 0, g: 1, b: 0 },
      //   };
      // }

      const {
        x, y, z, N: luminosity, K: color,
      } = visibleStars[i];

      if (color) {
        colors.push(color.r, color.g, color.b);
      }
      else {
        colors.push(0.426, 0.559, 1);
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

    bufferGeometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(
      new Float32Array(colors), 3,
    ));
    bufferGeometry.setAttribute('aLuminosity', new THREE.InstancedBufferAttribute(
      new Float32Array(luminosities), 1,
    ));

    instancedPlane.visible = this._visible;

    // instancedPlane.position.copy(solPosition);
    instancedPlane.instanceMatrix.needsUpdate = true;

    console.log('instanced star plane:', instancedPlane);

    scene.add(instancedPlane);
    this.instancedPlane = instancedPlane;
    this.onStarGeneratorReady.setValue(true);

    console.log('Loaded', visibleStars.length, 'stars.');

    // Galaxy center marker. Used to double-check star placement.
    // const size = 0.00125;
    // const geometry = new THREE.BoxGeometry(size, size * 64, size);
    // const material2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // const cube = new THREE.Mesh(geometry, material2);
    // scene.add(cube);
  }
  
  hideStars() {
    if (this.instancedPlane) {
      this.instancedPlane.visible = this._visible = false;
    }
  }

  showStars() {
    if (this.instancedPlane) {
      this.instancedPlane.visible = this._visible = true;
    }
  }
}
