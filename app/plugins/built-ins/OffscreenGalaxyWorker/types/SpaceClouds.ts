import * as THREE from 'three';
import ChangeTracker from 'change-tracker/src';
import { extractVertsFromGeo } from '../../../../local/mathUtils';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import { galaxyDust } from '../shaders/galaxyDust.glsl';
import { DustType } from './DustType';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CanvasTexture } from 'three';

const gltfLoader = new GLTFLoader();

export default class SpaceClouds {
  public rng: FastDeterministicRandom;
  public onSolPosition: ChangeTracker;
  public onSpaceCloudsReady: ChangeTracker;
  private _visible: boolean;
  private instancedPlane!: THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  /**
   * @param datasetMode - If true, nothing will be rendered, but positions will
   *                      still be processed.
   * @param scene
   * @param galaxyMeshUrl
   * @param fogTexture
   */
  constructor({
    datasetMode, scene, galaxyMeshUrl, fogTexture,
  }: {
    datasetMode: boolean, scene: THREE.Scene, galaxyMeshUrl: ArrayBuffer | string,
    fogTexture: CanvasTexture,
  }) {
    this.rng = new FastDeterministicRandom();
    // Chosen with: Math.floor(Math.random() * 16384)
    this.rng.seed = 8426;
    this._visible = true;

    this.onSolPosition = new ChangeTracker();
    this.onSpaceCloudsReady = new ChangeTracker();

    if (typeof galaxyMeshUrl === 'string') {
      gltfLoader.load(galaxyMeshUrl, (gltf) => {
        this.processGltf(gltf, datasetMode, scene, fogTexture);
      }, (error) => {
        console.error(error);
      });
    }
    else {
      // Note: if using a URL, change to: gltfLoader.load(galaxyMeshUrl, (gltf) => {});
      gltfLoader.parse(galaxyMeshUrl, '', (gltf) => {
        this.processGltf(gltf, datasetMode, scene, fogTexture);
      }, (error) => {
        console.error(error);
      });
    }
  }

  processGltf(gltf: object, datasetMode: boolean, scene: THREE.Scene, fogTexture: CanvasTexture) {
    // @ts-ignore
    const gltfScene: THREE.Scene = gltf.scene;

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

    // Note: this controls the render order.
    // Changing the order in which dust is rendered drastically effects visuals.
    const dustPoints = [ thinDustPoints, galacticPoints, thickDustPoints ].flat();

    // This order needs to match dustPoints order, else the shader will
    // assign the wrong lighting to the wrong particles.
    const dustTypes = [ thinDustTypes, galacticTypes, thickDustTypes ].flat();

    if (!datasetMode) {
      this.setupGalacticArmsInstanced(scene, dustTypes, dustPoints, fogTexture);
    }
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
    scene: THREE.Scene, dustTypes : any[], dustPoints : any[], fogTexture: CanvasTexture,
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
    this.instancedPlane = instancedPlane;

    scene.add(instancedPlane);
    this.onSpaceCloudsReady.setValue(true);
  }

  hideClouds() {
    if (this.instancedPlane) {
      this.instancedPlane.visible = this._visible = false;
    }
  }

  showClouds() {
    if (this.instancedPlane) {
      this.instancedPlane.visible = this._visible = true;
    }
  }
}
