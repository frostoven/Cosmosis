import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import { makePhysical, shapeTemplates } from '../local/physics';

// Configure and create Draco decoder.
// var dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/' );
// dracoLoader.setDecoderConfig( { type: 'js' } );

var loader = new GLTFLoader().setPath( 'potatoLqAssets/spaceShips/' );
// loader.load( 'DamagedHelmet.gltf', function ( gltf ) {
//
//   gltf.scene.traverse(function (child) {
//     if (child.isMesh) {
//       // TOFIX RoughnessMipmapper seems to be broken with WebGL 2.0
//       // roughnessMipmapper.generateMipmaps( child.material );
//     }
//   });
//
//   scene.add(gltf.scene);
//   roughnessMipmapper.dispose();
//   render();
// });

// dracoLoader.load( 'models/draco/bunny.drc', function ( geometry ) {
//
//   geometry.computeVertexNormals();
//
//   var material = new THREE.MeshStandardMaterial({color: 0x606060});
//   var mesh = new THREE.Mesh(geometry, material);
//   mesh.castShadow = true;
//   mesh.receiveShadow = true;
//   scene.add(mesh);
//
//   // Release decoder resources.
//   dracoLoader.dispose();
//
// });


const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./node_modules/three/examples/js/libs/draco/');
dracoLoader.setDecoderConfig( { type: 'js' } );
dracoLoader.preload();
loader.setDRACOLoader(dracoLoader);
// dracoLoader.dispose();

loader.load( 'DS69F.gltf', function ( gltf ) {

  // gltf.scene.traverse(function (child) {
  //   if (child.isMesh) {
  //     console.log(child);
  //   }
  // });

  //

  console.log('[Debug] GLTF:', gltf);
  storeMesh(gltf);

  // dracoLoader.dispose();
});

const waitingRoom = {
  DS69F: [],
};

const _mesh = {
  DS69F: null,
};

function storeMesh(gltf) {
  _mesh.DS69F = gltf;
  if (waitingRoom.DS69F.length > 0) {
    let callback;
    while (callback = waitingRoom.DS69F.shift()) {
      callback(_mesh.DS69F);
    }
  }
}

export function getMesh(modelName, callback) {
  if (_mesh[modelName]) {
    callback(_mesh[modelName]);
  }
  else {
    waitingRoom[modelName].push(callback);
  }
}

/**
 *
 * @param {string} modelName
 * @param {THREE.Vector3} pos
 * @param {THREE.scene} scene
 * @param {CANNON.World} world
 * @param {function} onReady
 */
export function createSpaceShip({ modelName, pos, scene, world, onReady }) {
  if (!$gameView.ready) {
    return setTimeout(() => {
      createSpaceShip({ modelName, pos, scene, world, onReady });
    }, 50);
  }

  if (!modelName) return console.error('createSpaceShip needs a model name.');
  if (!pos) pos = $gameView.camera.position;
  if (!scene) scene = $gameView.scene;
  if (!world) world = $gameView.spaceWorld;
  if (!onReady) onReady = () => {};

  getMesh(modelName, (mesh) => {
    mesh.scene.position.copy($gameView.camera.position);
    //
    // TODO: remove this light. This is only here until lights become dynamic.
    // const warmWhite = 0xefebd8;
    // const warmWhite = 0xfff5b6;
    const warmWhite = 0xfff5b6;
    const light = new THREE.PointLight( warmWhite, 1.5, 100 );
    // light.position.set(pos.x, pos.y + 2, pos.z);
    light.position.set(0, 2, 0);
    mesh.scene.add( light );
    //
    scene.add(mesh.scene);

    const body = makePhysical({
      mesh: mesh.scene,
      // TODO: for now we use a simple cube shape just to get the framework up.
      //  This needs to become a compound shape in future using the p[a]_ tags
      //  (see mesh codes -> Physics collision node codes).
      bodyShape: shapeTemplates.cubeShape(1.2, 1, 1.8),
      options: { mass: 1 },
      world,
    });

    const { x, y, z } = mesh.scene.position;
    console.log(`=> Physical ship ${modelName} created at ${x},${y},${z};`, mesh);
    onReady(mesh);
  })
}

export default {
  getMesh,
  createSpaceShip,
};
