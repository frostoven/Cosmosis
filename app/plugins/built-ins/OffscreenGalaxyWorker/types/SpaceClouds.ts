import * as THREE from 'three';
import MeshLoader from '../../NodeOps/types/MeshLoader';
import { gameRuntime } from '../../../gameRuntime';
import {
  clamp,
  extractAndPopulateVerts,
  extractVertsFromGeo,
} from '../../../../local/mathUtils';
import FastDeterministicRandom from '../../../../random/FastDeterministicRandom';
import { galaxyCenter } from '../shaders/galaxyCenter.glsl';
import { galaxyDust } from '../shaders/galaxyDust.glsl';
import { galaxyDustSprite } from '../shaders/galaxyDustSprite.glsl';
import { DustType } from './DustType';

// THREE.ShaderChunk.fog_fragment = `
//   #ifdef USE_FOG
//     vec3 fogOrigin = vec3(0.0, 0.0, 0.0);
//     vec3 fogDirection = normalize(vWorldPosition - fogOrigin);
//     float fogDepth = distance(vWorldPosition, fogOrigin);
//
//     float heightFactor = 0.05;
//     float fogFactor =
//       heightFactor * exp(-fogOrigin.y * fogDensity) *
//       (1.0 - exp(-fogDepth * fogDirection.y * fogDensity) / fogDirection.y);
//       fogFactor = saturate(fogFactor);
//
//     gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
//   #endif
// `;
//
// THREE.ShaderChunk.fog_pars_fragment = `
//   #ifdef USE_FOG
//     uniform vec3 fogColor;
//     varying vec3 vWorldPosition;
//     #ifdef FOG_EXP2
//       uniform float fogDensity;
//     #else
//       uniform float fogNear;
//       uniform float fogFar;
//     #endif
//   #endif
// `;
//
// THREE.ShaderChunk.fog_vertex = `
//   #ifdef USE_FOG
//     vWorldPosition = transformed;
//   #endif
// `;
//
// THREE.ShaderChunk.fog_pars_vertex = `
//   #ifdef USE_FOG
//     varying vec3 vWorldPosition;
//   #endif
// `;

const smokeSprites = [
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke1.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke2.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smoke3b.png'),
];

const smokeMasks = [
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/smokeMask1.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/fakeNoise.png'),
  new THREE.TextureLoader().load('potatoLqAssets/smokeImg/fakeNoise2.png'),
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

        const dustPoints: any[] = [];
        const dustTypes: any[] = [];

        gltfScene.traverse((node) => {
          if (node.type === 'Object3D' && node.name === 'SagA_str') {
            return this.setupGalacticCenter(node);
          }
          else if (node.type !== 'LineSegments') {
            return;
          }

          // @ts-ignore
          const lineSegments: THREE.LineSegments = node;
          const vertPositions = extractVertsFromGeo(lineSegments.geometry);
          // const vertPositions = extractAndPopulateVerts(lineSegments.geometry);

          // const group = new THREE.Group();
          for (let i = 0, len = vertPositions.length; i < len; i++) {
            const v3: THREE.Vector3 = vertPositions[i];
            const point = new THREE.Object3D();
            lineSegments.add(point);
            point.position.set(v3.x, v3.y, v3.z);
            scene.attach(point);
            const position = point.position;

            let xRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();
            let yRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();
            let zRng = ((this.rng.next() - 0.5) * 0.05) * this.rng.next();

            dustPoints.push(
              new THREE.Vector3(
                position.x + xRng,
                position.y + yRng,
                position.z + zRng,
              ),
            );
            dustTypes.push(DustType.thick);

            // Thin dust within thick dust.
            for (let i = 0; i < 25; i++) {
              xRng = ((this.rng.next() - 0.5) * 0.25) * this.rng.next();
              yRng = ((this.rng.next() - 0.5) * 0.01) * this.rng.next();
              zRng = ((this.rng.next() - 0.5) * 0.25) * this.rng.next();
              dustPoints.push(
                new THREE.Vector3(
                  position.x + xRng,
                  position.y + yRng,
                  position.z + zRng,
                )
              );
              dustTypes.push(DustType.thin);
            }

            scene.remove(point);
          }
        });

        // this.setupGalacticArmsNonInstanced(scene, dustPoints);
        this.setupGalacticArmsInstanced(
          scene, dustTypes, dustPoints,
        );
      });
    });
  }

  setupGalacticCenter(node: THREE.Object3D) {
    // const material = new THREE.ShaderMaterial({
    //   vertexShader: galaxyCenter.vertex,
    //   fragmentShader: galaxyCenter.fragment,
    //   glslVersion: THREE.GLSL3,
    //   transparent: true,
    //   side: THREE.BackSide, // THREE.BackSide,
    //   uniforms: {
    //     texture1: { value: smokeMasks[1] },
    //     alphaMask: { value: smokeMasks[0] },
    //   }
    // });
    //
    // const icoSphereGeo = new THREE.IcosahedronGeometry(0.02, 32);
    // // const galacticCenter = new THREE.Mesh(icoSphereGeo, material);
    // const galacticCenter = new THREE.Mesh(new THREE.PlaneBufferGeometry(5, 5), material);
    // galacticCenter.rotateX(Math.PI / 2);
    //
    // gameRuntime.tracked.levelScene.getOnce((scene: THREE.Scene) => {
    //   scene.add(galacticCenter);
    // });
  }

  setupGalacticArmsNonInstanced(scene: THREE.Scene, dustPoints: any[]) {
    const allClouds: any[] = [];

    for (let i = 0, len = dustPoints.length; i < len; i++) {
      const point: THREE.Vector3 = dustPoints[i];
      const geometry = new THREE.PlaneBufferGeometry(0.025, 0.025);
      const material = new THREE.MeshBasicMaterial({
        color: 0x2f91c7,
        side: THREE.DoubleSide,
        transparent: true,
        map: smokeMasks[2],
      });
      const dust = new THREE.Mesh(geometry, material);
      scene.add(dust);
      dust.position.copy(point);
      allClouds.push(dust);
    }

    const tmpLookAt = new THREE.Vector3();
    gameRuntime.tracked.player.getOnce((player) => {
      const camera: THREE.PerspectiveCamera = player.camera;
      gameRuntime.tracked.core.getOnce((core) => {
        core.onAnimate.getEveryChange(() => {
          for (let i = 0, len = allClouds.length; i < len; i++) {
            const dust: THREE.Mesh = allClouds[i];
            camera.getWorldPosition(tmpLookAt);
            dust.lookAt(camera.position);
          }
        });
      });
    });
  }

  setupGalacticArmsInstanced(
    scene: THREE.Scene, dustTypes : any[], dustPoints : any[],
  ) {
    const sprite = smokeSprites[smokeModIndex++ % smokeLength];
    sprite.wrapS = THREE.RepeatWrapping;
    sprite.wrapT = THREE.RepeatWrapping;

    const material = new THREE.ShaderMaterial({
      vertexShader: galaxyDust.vertex,
      fragmentShader: galaxyDust.fragment,
      transparent: true,
      uniforms: {
        thinDust: { value: smokeMasks[2] },
      }
    });

    const bufferGeometry = new THREE.PlaneBufferGeometry(0.025, 0.025);
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
