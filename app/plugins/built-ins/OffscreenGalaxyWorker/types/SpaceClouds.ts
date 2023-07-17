import * as THREE from 'three';
import MeshLoader from '../../NodeOps/types/MeshLoader';
import { gameRuntime } from '../../../gameRuntime';
import { clamp, extractAndPopulateVerts } from '../../../../local/mathUtils';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import { galaxyDust } from '../shaders/galaxyDust.glsl';
import Core from '../../Core';

const smokeSprites = [
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke1.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke2.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3b.png'),
];

let smokeModIndex = 0;
const smokeLength = smokeSprites.length;

for (let i = 0, len = smokeSprites.length; i < len; i++) {
  const sprite = smokeSprites[i];
  // TODO: Upgrade three.js to gain access to this.
  // sprite.colorSpace = THREE.SRGBColorSpace;
}

export default class SpaceClouds {
  public smokeSprites: THREE.Texture[];
  public rng: FastDeterministicRandom;

  constructor() {
    this.rng = new FastDeterministicRandom();
    // Chosen with: Math.floor(Math.random() * 16384)
    this.rng.seed = 8426;

    this.smokeSprites = smokeSprites;

    const meshLoader = new MeshLoader('milky_way', 'getStarCatalog', {
      ...MeshLoader.defaultNodeOpts,
      castShadow: false,
      receiveShadow: false,
    });

    meshLoader.trackedMesh.getOnce((galaxy) => {
      gameRuntime.tracked.levelScene.getOnce((scene: THREE.Scene) => {
        const gltfScene: THREE.Scene = galaxy.gltf.scene;
        const galaxyPoints: any[] = [];

        gltfScene.traverse((node) => {
          if (node.type !== 'LineSegments') {
            return;
          }

          // @ts-ignore
          const lineSegments: THREE.LineSegments = node;
          const vertPositions = extractAndPopulateVerts(lineSegments.geometry);

          // const group = new THREE.Group();
          for (let i = 0, len = vertPositions.length; i < len; i++) {
            const v3: THREE.Vector3 = vertPositions[i];
            const point = new THREE.Object3D();
            lineSegments.add(point);
            point.position.set(v3.x, v3.y, v3.z);
            scene.attach(point);
            const position = point.position;

            const xRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();
            const yRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();
            const zRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();

            galaxyPoints.push(
              new THREE.Vector3(
                position.x + xRng,
                position.y + yRng,
                position.z + zRng,
              ),
            );

            scene.remove(point);
          }
        });

        const sprite = smokeSprites[smokeModIndex++ % smokeLength];
        sprite.wrapS = THREE.RepeatWrapping;
        sprite.wrapT = THREE.RepeatWrapping;

        const material = new THREE.ShaderMaterial({
          vertexShader: galaxyDust.vertex,
          fragmentShader: galaxyDust.fragment,
          transparent: true,
          uniforms: {
            texture1: { value: smokeSprites[0] },
            texture2: { value: smokeSprites[0] },
            alphaTest: { value: 0.5 },
          }
        });

        const instancedPlane = new THREE.InstancedMesh(
          new THREE.PlaneBufferGeometry(0.025, 0.025),
          material,
          galaxyPoints.length,
        );

        const dummy = new THREE.Object3D();

        for (let i = 0, len = galaxyPoints.length; i < len; i++) {
          // const mesh = instancedPlane.count[i];
          const position = galaxyPoints[i];
          dummy.position.set(position.x, position.y, position.z);
          dummy.updateMatrix();
          instancedPlane.setMatrixAt(i, dummy.matrix);
        }
        instancedPlane.instanceMatrix.needsUpdate = true;

        console.log('instancedPlane:', instancedPlane);

        scene.add(instancedPlane);
      });
    });
  }

  addArm(parent: THREE.LineSegments) {
    //
  }
}
