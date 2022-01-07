import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import AssetFinder from '../local/AssetFinder';
import { setup as meshCodeSetup } from './meshCodeProcessor';
import Level from './level';
import { startupEvent, getStartupEmitter } from '../emitters';
import userProfile from '../userProfile';

const startupEmitter = getStartupEmitter();

// Configure and create Draco decoder.
// var dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/' );
// dracoLoader.setDecoderConfig( { type: 'js' } );

// var loader = new GLTFLoader().setPath( 'potatoLqAssets/spaceships/' );
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
  AssetFinder.getSpaceship({
    name,
    callback: (error, filename, dir) => {
      loader.setPath(dir + '/');
      loader.load(filename, function(gltf) {

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
    }
  });
}

function modelPostSetup(modelName, gltf, pos, scene, world, onReady) {
  getMesh(modelName, (mesh) => {
    // TODO: improve the way this is decided. The spaceship designer should be
    //  choosing what the standard arrow is.
    const standardArrow = mesh.cameras[0];

    // Spaceship container.
    const bubble = new THREE.Group();
    bubble.add(mesh.scene);
    scene.add(bubble);

    // Get warp bubble world direction:
    let bubbleDirection = new THREE.Vector3();
    bubble.getWorldDirection(bubbleDirection);

    // Follows the ship, but does not rotate with it.
    const centerPoint = new THREE.Group();
    scene.add(centerPoint);

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

    // const warmWhite = 0xfff5b6;

    // Make the ship cast/receive shadows, including self-shadows:
    gltf.scene.traverse(function(node) {
      if (node.isMesh) {
        // Backface culling. Without this shadows get somewhat insane because
        // *all* faces then emit shadows.
        node.material.side = THREE.FrontSide;
        node.castShadow = true;
        node.receiveShadow = true;
        // console.log('got:', node, 'cast:', node.castShadow, 'recv:', node.receiveShadow);
      }
    });

    const { createDebugFloor } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    }).debug;
    //
    if (createDebugFloor && createDebugFloor.enabled) {
      const opts = createDebugFloor;
      // Creates a platform that follows the player around.
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(opts.size, opts.size),
        new THREE.MeshPhongMaterial({ color: opts.floorColor })
      );
      // Note: this is relative and needs to happen before rotation.
      opts.yOffset && floor.translateY(opts.yOffset);
      floor.rotation.x = THREE.Math.degToRad(-90);
      floor.receiveShadow = opts.receiveShadow;
      bubble.add(floor);

      const grid = new THREE.GridHelper(opts.size, opts.divisions, opts.axisColor, opts.gridColor);
      opts.yOffset && grid.translateY(opts.yOffset);
      grid.material.opacity = opts.gridOpacity;
      grid.material.transparent = opts.gridOpacity !== 1;
      bubble.add(grid);
    }

    onReady(mesh, bubble, centerPoint);
  });
}

function processMeshCodes(name, gltf, isPlayer) {
  // Concept vars:
  // gltf.csmNodes
  // gltf.csmUsable
  // gltf.csmDestructibles

  const level = new Level(gltf);
  const nameMap = {};

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
 * @param {function} onReady - onReady(mesh, warpBubble, centerPoint);
 *   mesh: spaceship model.
 *   warpBubble: group containing everything that needs to move and rotate with
 *     the ship.
 *   centerPoint: group that moves with the ship, but does not rotate with it.
 */
export function createSpaceship({ modelName, pos, scene, world, isPlayer, onReady }) {
  console.log(`Loading ship %c${modelName}`, 'font-weight: bold;');
  startupEmitter.on(startupEvent.gameViewReady, () => {
    if (!modelName) return console.error('createSpaceship needs a model name.');
    if (!pos) pos = $game.camera.position;
    if (!onReady) onReady = () => {};

    createDefaults(modelName);
    loadModel(modelName, (gltf) => {
      processMeshCodes(modelName, gltf, isPlayer);
      modelPostSetup(modelName, gltf, pos, scene, world, onReady);
    });
  });
}

export default {
  getMesh,
  createSpaceship,
};
