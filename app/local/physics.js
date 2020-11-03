import * as THREE from "three";
import * as CANNON from "cannon";

import './cannonDebugRenderer';

// If true, draw bounding boxes over all physics objects.
// const debugBodyConstraints = true;

export const shapeTemplates = {
  planeShape: () => new CANNON.Plane(),
  cubeShape: (x=0.5, y=0.5, z=0.5) => new CANNON.Box(new CANNON.Vec3(x, y, z)),
  compoundShape: (mesh) => {
    // https://stackoverflow.com/questions/30675493/cannon-js-complex-shapes
    // http://schteppe.github.io/cannon.js/demos/compound.html
    console.log('tba');
  }
};

/**
 * Returns a physics world object representing outer space.
 */
export function initSpacePhysics({ scene, debug=false }={}) {
  // TODO: this physics world represents space. We need to think about how
  //  we're going to deal with planetary landings. In particular, the gravity
  //  vector always needs to point to the planet origin. We also need to think
  //  about how we're going to hack in ships orbiting around bodies.

  if (!scene) {
    scene = $gameView.scene;
  }

  const physicsWorld = new CANNON.World();
  physicsWorld.broadphase = new CANNON.NaiveBroadphase();
  physicsWorld.gravity.set(0, 0, 0);
  physicsWorld.solver.tolerance = 0.001;

  if (debug) {
    // Enable physics debugger.
    physicsWorld.debugRenderer = new THREE.CannonDebugRenderer(
      scene,
      physicsWorld
    );
  }

  return physicsWorld;
}

/**
 * Returns a physics world object representing a planet, star, and black hole
 * environments. Specifically, attempts to simulate space-time curvature cause
 * by gravity.
 * @returns {null}
 */
function initGravitationalPhysics() {
  console.log('initGravitationalPhysics has not yet been implemented.');
  return null;
  // TODO: when this is implemented, we likely won't use cannon's built-in
  //  mechanisms for gravity because gravity changes as you approach a body.
  //  The only reason this is separate from initSpacePhysics is because
  //  calculating the microgravity of 10 planets 1AU away is a waste of cpu and
  //  has almost no effect on the ship. Land physics need to kick in as soon as
  //  we're lose enough to a planet that a straight line curves towards the
  //  body. It would be really lovely to have your trajectory annoying shifted
  //  a degrees because you're flying to close to the local star.
}

/**
 * Makes a mesh a physics body. The physics body is then managed by the physics
 * engine.
 * @param {THREE.Scene} mesh
 * @param bodyShape
 * @param {object} options
 * @param {CANNON.World} world
 * @returns {CANNON.Body}
 */
export function makePhysical({ mesh, bodyShape, options, world }) {
  // Examples:
  // var planeShape = new CANNON.Plane();
  // var groundBody = new CANNON.Body({ mass: 0 });
  // groundBody.addShape(planeShape);
  //
  // var cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  // var body = new CANNON.Body({ mass: 1 });
  // body.addShape(cubeShape);

  if (!world || !world.addBody) {
    console.error('makePhysical requires a valid cannon world object.');
    return null;
  }

  const body = new CANNON.Body({ mass: 1 });
  body.addShape(bodyShape);
  body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
  world.addBody(body);

  if (!world.sjMeshes) {
    world.sjMeshes = [ [ mesh, body ] ];
  }
  else {
    world.sjMeshes.push(mesh);
  }

  return body;
}

function meshAsPlane() {
  //
}

function meshAsCube() {
  //
}

function meshAsConvexHull() {
  //
}

export function renderPhysics(delta, world) {
  world.step(delta);
  if (world.sjMeshes) {
    for (let i = 0, len = world.sjMeshes.length; i < len; i++) {
      const [mesh, body] = world.sjMeshes[i];
      mesh.position.copy(body.position);
    }
  }

  if (world.debugRenderer) {
    world.debugRenderer.update();
  }
}


// --- tests ------------------------------------------------------------------

// TODO: implement a mechanisms allows dynamically changing scene so this can
//  run without manually typing into the dev console.

function requireScene() {
  if (!$gameView || !$gameView.scene) {
    throw 'This test requires a global scene stored in $gameView.scene.';
  }
}

function _randXYZ() {
  return {
    x: Math.random() - 0.5,
    y: 2.5 * i + 0.5,
    z: Math.random() - 0.5,
  };
}

function _getWorldForTesting(world) {
  if (!world) return initSpacePhysics({ debug: true });
  return world;
}

export const visualTests = {
  cubeTemplate: (pos) => {
    requireScene();
    if (!pos) pos = _randXYZ();
    const world = initSpacePhysics(true);
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(pos.x, pos.y, pos.z);
    world.addBody(body);
  },
  createCube: (pos, world) => {
    requireScene();
    if (!pos) pos = _randXYZ();
    world = _getWorldForTesting(world);

    console.log('Create geometry and add to global scene.');
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x7f7f7f });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(pos);
    $gameView.scene.add(cube);

    console.log('Turn into a physics object.');
    // meshAsCube({
    const body = makePhysical({
      mesh: cube,
      bodyShape: shapeTemplates.cubeShape(),
      options: { mass: 1 },
      world,
    });

    const impulse  = new CANNON.Vec3(-1, -0.5, 0);
    const worldPoint = new CANNON.Vec3(0, 0, 0);
    setTimeout(() => {
      body.applyImpulse(impulse, worldPoint);
    }, 750);
    return body;
  },
};

export const tests = {
  initSpacePhysicsTest: () => {
    console.log('Ensure initSpacePhysics return truthy value.');
    return !!initSpacePhysics();
  }
}

export default {
  tests,
  visualTests,
  initSpacePhysics,
  makePhysical,
  renderPhysics,
  shapeTemplates,
};
