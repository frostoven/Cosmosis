import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import core from '../local/core';
import { makePhysical, shapeTemplates } from '../local/physics';
import AssetFinder from '../local/AssetFinder';
import { setup as meshCodeSetup } from './meshCodeProcessor';
import Level from './level';

// Configure and create Draco decoder.
// var dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/' );
// dracoLoader.setDecoderConfig( { type: 'js' } );

// var loader = new GLTFLoader().setPath( 'potatoLqAssets/spaceShips/' );
const loader = new GLTFLoader();

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

const waitingRoom = {};
const _mesh = {};

function createDefaults(name) {
  if (!waitingRoom[name]) {
    waitingRoom[name] = [];
  }
}

function storeMesh(name, gltf) {
  _mesh[name] = gltf;
  if (waitingRoom[name].length > 0) {
    let callback;
    while (callback = waitingRoom[name].shift()) {
      callback(_mesh[name]);
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

function loadModel(name, callback) {
  AssetFinder.getSpaceShip(name, (error, filename, dir) => {
    loader.setPath(dir + '/');
    loader.load(filename, function (gltf) {

      // gltf.scene.traverse(function (child) {
      //   if (child.isMesh) {
      //     console.log(child);
      //   }
      // });

      storeMesh(name, gltf);
      callback(gltf);

      // dracoLoader.dispose();
    });
    //
  });
}

function modelPostSetup(modelName, gltf, pos, scene, world, onReady) {
  getMesh(modelName, (mesh) => {
    // TODO: improve the way this is decided. The space ship designer should be
    //  choosing what the standard arrow is.
    const standardArrow = mesh.cameras[0];

    // Space ship container.
    const bubble = new THREE.Group();
    bubble.add(mesh.scene);
    scene.add(bubble);

    // Get warp bubble world direction:
    let bubbleDirection = new THREE.Vector3();
    bubble.getWorldDirection(bubbleDirection);

    // Get standard arrow world direction:
    let camDirection = new THREE.Vector3();
    standardArrow.getWorldDirection(camDirection);

    // Define a rotation from their unit-length vectors:
    let quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(camDirection.normalize(), bubbleDirection.normalize());
    // ^^ note: term order is important.

    // Apply rotation to ship (ship rotates inside bubble, bubble stays
    // stationary for this operation). This allows the artist to model the ship
    // in any orientation.
    let matrix = new THREE.Matrix4();
    matrix.makeRotationFromQuaternion(quaternion);
    mesh.scene.applyMatrix4(matrix);

    // TODO: remove this light. This is only here until lights become dynamic.
    // const warmWhite = 0xefebd8;
    // const warmWhite = 0xfff5b6;
    const warmWhite = 0xfff5b6;
    // const light = new THREE.PointLight( warmWhite, 1.5, 100 );
    const light = new THREE.PointLight( warmWhite, 2, 100 );
    // light.position.set(pos.x, pos.y + 2, pos.z);
    // light.position.set(0, 2, 0);
    light.position.set(0, 2, -5);
    mesh.scene.add(light);
    //
    const light2 = new THREE.PointLight( warmWhite, 2, 100 );
    // light.position.set(pos.x, pos.y + 2, pos.z);
    light2.position.set(0, 2, 3);
    mesh.scene.add(light2);

    // TODO: implement the physics things.
    // const body = makePhysical({
    //   mesh: mesh.scene,
    //   // TODO: for now we use a simple cube shape just to get the framework up.
    //   //  This needs to become a compound shape in future using the p[a]_ tags
    //   //  (see mesh codes -> Physics collision node codes).
    //   bodyShape: shapeTemplates.cubeShape(1.2, 1, 1.8),
    //   options: { mass: 1 },
    //   world,
    // });
    onReady(mesh, bubble);
  });
}

function processMeshCodes(name, gltf, isPlayer) {
  // Concept vars:
  // gltf.csmNodes
  // gltf.csmUsable
  // gltf.csmDestructibles

  const level = new Level(gltf);
  const nameMap = {};

  // console.log('=========> [processMeshCodes] GLTF:', gltf);
  // const nodes = gltf.parser.json.nodes;
  const nodes = gltf.scene.children;
  for (let i = 0, len = nodes.length; i < len; i++) {
    const node = nodes[i];
    // if (node.name === 'switchForTheDoor' || node.name === 'theDoor') {
    //   console.log('=========> [processMeshCodes] GLTF:', node);
    // }
    nameMap[node.name] = i;
    meshCodeSetup(node, isPlayer, level);

    //*  if not player, exclude interactables (and test to make sure it's not actually processing distance).
    //*  even if not player, still check for destructibility and process things like collision.
    //*  make hitboxes invisible or delete them entirely and tell the physics engine to load them in.
  }
  level.setNameMap(nameMap);

  $game.level = level;
}

/**
 *
 * @param {string} modelName
 * @param {THREE.Vector3} pos
 * @param {THREE.scene} scene
 * @param {CANNON.World} world
 * @param {boolean} isPlayer - If true, this is the player's ship.
 * @param {function} onReady
 */
export function createSpaceShip({ modelName, pos, scene, world, isPlayer, onReady }) {
  core.startupEmitter.on(core.startupEvent.gameViewReady, () => {
    if (!modelName) return console.error('createSpaceShip needs a model name.');
    if (!pos) pos = $game.camera.position;
    if (!scene) scene = $game.scene;
    if (!world) world = $game.spaceWorld;
    if (!onReady) onReady = () => {};

    createDefaults(modelName);
    loadModel(modelName, (gltf) => {
      processMeshCodes(modelName, gltf, isPlayer);
      modelPostSetup(modelName, gltf, pos, scene, world, onReady);
    })
  });
}

export default {
  getMesh,
  createSpaceShip,
};
