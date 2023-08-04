import * as THREE from 'three';
import ChangeTracker from 'change-tracker/src';
import MeshLoader from '../../NodeOps/types/MeshLoader';
import { gameRuntime } from '../../../gameRuntime';
import {
  extractAndPopulateVerts,
  extractVertsFromGeo,
} from '../../../../local/mathUtils';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import { galaxyDust } from '../shaders/galaxyDust.glsl';
import { DustType } from './DustType';

const fogTexture = new THREE.TextureLoader().load(
  'potatoLqAssets/smokeImg/fogColumn.png'
);

export default class SpaceClouds {
  public rng: FastDeterministicRandom;
  public onSolPosition: ChangeTracker;

  /**
   * @param datasetMode - If true, nothing will be rendered, but positions will
   *                      still be processed.
   */
  constructor({ datasetMode } = { datasetMode: false }) {
    this.rng = new FastDeterministicRandom();
    // Chosen with: Math.floor(Math.random() * 16384)
    this.rng.seed = 8426;

    this.onSolPosition = new ChangeTracker();

    const meshLoader = new MeshLoader('milky_way', 'getStarCatalog', {
      ...MeshLoader.defaultNodeOpts,
      castShadow: false,
      receiveShadow: false,
    });

    meshLoader.trackedMesh.getOnce((galaxy) => {
      gameRuntime.tracked.levelScene.getOnce((scene: THREE.Scene) => {
        const gltfScene: THREE.Scene = galaxy.gltf.scene;

        const thickDustPoints: any[] = [];
        const thickDustTypes: any[] = [];

        const thinDustPoints: any[] = [];
        const thinDustTypes: any[] = [];

        const galacticPoints: any[] = [];
        const galacticTypes: any[] = [];

        gltfScene.traverse((node) => {
          // let reduceDensity = node.name === 'inner_arm_1' || node.name === 'inner_arm_2';
          if (node.type === 'Object3D') {
            if (node.name === 'SagA_str') {
              return this.createGalacticCenterPositions(
                scene, node, galacticTypes, galacticPoints
              );
            }
            else if (node.name === 'Sol') {
              this.onSolPosition.setValue(node.position);
            }
          }
          else if (node.type === 'LineSegments') {
            this.createGalacticArmPositions(
              scene, node,
              thickDustTypes, thickDustPoints, thinDustTypes, thinDustPoints
            );
          }
        });

        // Note: this controls the render order. Changing the order in which
        // dust is rendered drastically effects visuals.
        const dustPoints = [ thinDustPoints, galacticPoints, thickDustPoints ].flat();

        // This order needs to match dustPoints order, else the shader will
        // assign the wrong lighting to the wrong particles.
        const dustTypes = [ thinDustTypes, galacticTypes, thickDustTypes ].flat();

        if (!datasetMode) {
          this.setupGalacticArmsInstanced(scene, dustTypes, dustPoints);
        }
      });
    });
  }

  generateSemiSphere(amount, position, direction, r=0.05, dustTypes: any[], dustPoints: any[]) {
    let yFactor = 0.25 * direction;
    let xzFactor = 1.75 * direction;

    for (let i = 0; i < amount; i++) {
      let xRng = r * Math.sin(i * THREE.MathUtils.DEG2RAD) * Math.sin(i) * xzFactor;
      let yRng = r * Math.cos(i * THREE.MathUtils.DEG2RAD) * yFactor;
      let zRng = r * Math.sin(i * THREE.MathUtils.DEG2RAD) * Math.cos(i) * xzFactor;


      dustPoints.push(
        new THREE.Vector3(
          position.x + xRng,
          position.y + yRng,
          position.z + zRng,
        ),
      );
      // dustTypes.push(DustType.galaxyCenter);
      dustTypes.push(DustType.thin);
    }
  }

  createGalacticCenterPositions(
    scene: THREE.Scene, node: THREE.Object3D, dustTypes: any[], dustPoints: any[],
  ) {
    const empty: THREE.Object3D = node;
    const position = empty.position;

    // Inner glow.
    this.generateSemiSphere(170, position, 1, 0.035, dustTypes, dustPoints);
    this.generateSemiSphere(170, position, -1, 0.035, dustTypes, dustPoints);

    // Mid glow.
    this.generateSemiSphere(300, position, 1, 0.06, dustTypes, dustPoints);
    this.generateSemiSphere(300, position, -1, 0.06, dustTypes, dustPoints);
  }

  createGalacticArmPositions(
    scene: THREE.Scene, node: THREE.Object3D,
    thickDustTypes: any[], thickDustPoints: any[], thinDustTypes: any[], thinDustPoints: any[],
  ) {
    // @ts-ignore
    const lineSegments: THREE.LineSegments = node;
    // TODO: add graphics option: Galactic Dust Density: normal | excessive.
    //  Add a note: There are barely any visual differences, but the
    //  differences in GPU requirements are huge.
    const vertPositions = extractVertsFromGeo(lineSegments.geometry);
    // const vertPositions = extractAndPopulateVerts(lineSegments.geometry);

    for (let i = 0, len = vertPositions.length; i < len; i++) {
      const v3: THREE.Vector3 = vertPositions[i];
      const point = new THREE.Object3D();
      lineSegments.add(point);
      point.position.set(v3.x, v3.y, v3.z);
      scene.attach(point);
      const position = point.position;

      let xRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();
      let yRng = ((this.rng.next() - 0.5) * 0.1) * this.rng.next();
      let zRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();

      thickDustPoints.push(
        new THREE.Vector3(
          position.x + xRng,
          position.y + yRng,
          position.z + zRng,
        ),
      );
      thickDustTypes.push(DustType.thick);

      // Thin dust within thick dust.
      for (let i = 0; i < 25; i++) {
        xRng = ((this.rng.next() - 0.5) * 0.25) * this.rng.next();
        yRng = ((this.rng.next() - 0.5) * 0.02) * this.rng.next();
        zRng = ((this.rng.next() - 0.5) * 0.25) * this.rng.next();
        thinDustPoints.push(
          new THREE.Vector3(
            position.x + xRng,
            position.y + yRng,
            position.z + zRng,
          )
        );
        thinDustTypes.push(DustType.thin);
      }

      scene.remove(point);
    }
  }

  setupGalacticArmsInstanced(
    scene: THREE.Scene, dustTypes : any[], dustPoints : any[],
  ) {
    const material = new THREE.ShaderMaterial({
      vertexShader: galaxyDust.vertex,
      fragmentShader: galaxyDust.fragment,
      transparent: true,
      uniforms: {
        thinDust: { value: fogTexture },
      }
    });

    const bufferGeometry = new THREE.PlaneGeometry(0.025, 0.025);
    bufferGeometry.setAttribute('aDustType', new THREE.InstancedBufferAttribute(
      new Int32Array(dustTypes), 1)
    );

    const instancedPlane = new THREE.InstancedMesh(
      bufferGeometry, material, dustPoints.length,
    );

    const dummy = new THREE.Object3D();

    for (let i = 0, len = dustPoints.length; i < len; i++) {
      // const mesh = instancedPlane.count[i];
      const position = dustPoints[i];
      dummy.position.set(position.x, position.y, position.z);
      dummy.updateMatrix();
      instancedPlane.setMatrixAt(i, dummy.matrix);
    }
    instancedPlane.instanceMatrix.needsUpdate = true;

    console.log('instancedPlane:', instancedPlane);

    scene.add(instancedPlane);
  }

  addArm(parent: THREE.LineSegments) {
  }
}
