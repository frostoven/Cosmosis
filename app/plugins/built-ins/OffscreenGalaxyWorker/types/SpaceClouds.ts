import * as THREE from 'three';
import MeshLoader from '../../NodeOps/types/MeshLoader';
import { gameRuntime } from '../../../gameRuntime';
import { extractAndPopulateVerts } from '../../../../local/mathUtils';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';

export default class SpaceClouds {
  public smokeSprites: THREE.Texture[];
  public rng: FastDeterministicRandom;

  constructor() {
    this.rng = new FastDeterministicRandom();
    // Chosen with: Math.floor(Math.random() * 16384)
    this.rng.seed = 8426;

    const smokeSprites = [
      new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke1.png'),
      new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke2.png'),
      new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3.png'),
      new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3b.png'),
    ];
    this.smokeSprites = smokeSprites;

    for (let i = 0, len = smokeSprites.length; i < len; i++) {
      const sprite = smokeSprites[i];
      // TODO: Upgrade three.js to gain access to this.
      // sprite.colorSpace = THREE.SRGBColorSpace;
    }

    const meshLoader = new MeshLoader('milky_way', 'getStarCatalog', {
      ...MeshLoader.defaultNodeOpts,
      castShadow: false,
      receiveShadow: false,
    });

    meshLoader.trackedMesh.getOnce((galaxy) => {
      gameRuntime.tracked.levelScene.getOnce((scene) => {
        const gltfScene: THREE.Scene = galaxy.gltf.scene;
        const galaxyGeo = [
          new THREE.BufferGeometry(),
          new THREE.BufferGeometry(),
          new THREE.BufferGeometry(),
          new THREE.BufferGeometry(),
        ];
        const galaxyPoints: number[][] = [
          [], [], [], [],
        ];

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

            for (let i = 0, len = galaxyPoints.length; i < len; i++) {
              const pointSegment = galaxyPoints[i];
              pointSegment.push(
                position.x + xRng,
                position.y + yRng,
                position.z + zRng,
              );
            }

            scene.remove(point);
          }
          // lineSegments.add(group);
        });

        // scene.add(gltfScene);
        for (let i = 0, len = galaxyGeo.length; i < len; i++) {
          const geoPart = galaxyGeo[i];
          geoPart.setAttribute('position', new THREE.Float32BufferAttribute(galaxyPoints[i], 3));
          const material = new THREE.PointsMaterial({
            size: 0.025,
            sizeAttenuation: true,
            map: smokeSprites[0],
            alphaTest: 0.5,
            transparent: true
          });

          const particles = new THREE.Points(geoPart, material);
          scene.add(particles);
        }
      });
    });
  }

  addArm(parent: THREE.LineSegments) {
    //
  }
}
