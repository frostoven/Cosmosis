let AmmoLib;

// // Softbody Physics variables
// const phys = {
//   gravityConstant: -9.8,
//   collisionConfiguration: null,
//   dispatcher: null,
//   broadphase: null,
//   solver: null,
//   softBodySolver: null,
//   physicsWorld: null,
//   rigidBodies: [],
//   margin: 0.05,
//   hinge: null,
//   rope: null,
//   transformAux1: null,
// };

// Hard body physics
const phys = {
  gravityConstant: -9.8,
  collisionConfiguration: null,
  dispatcher: null,
  broadphase: null,
  solver: null,
  physicsWorld: null,
  margin: 0.05,
};

function initPhysics(onComplete=()=>{}) {
    if (AmmoLib) {
        return onComplete(phys);
    }

    Ammo().then(function(lib) {
      AmmoLib = lib;
      phys.physics = lib;
      console.log('AmmoLib:', lib)
      initPhysicsVars();
      onComplete(phys);
    });
}

function initPhysicsVars() {
  // Hard body physics
  phys.collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration();
  phys.dispatcher = new AmmoLib.btCollisionDispatcher(phys.collisionConfiguration);
  phys.broadphase = new AmmoLib.btDbvtBroadphase();
  phys.solver = new AmmoLib.btSequentialImpulseConstraintSolver();
  phys.physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(
    phys.dispatcher,
    phys.broadphase,
    phys.solver,
    phys.collisionConfiguration,
  );
  phys.physicsWorld.setGravity(new AmmoLib.btVector3(0, -phys.gravityConstant, 0));

  phys.transformAux1 = new AmmoLib.btTransform();
  phys.tempBtVec3_1 = new AmmoLib.btVector3(0, 0, 0);

  // // Soft body physics configuration
  // phys.collisionConfiguration = new AmmoLib.btSoftBodyRigidBodyCollisionConfiguration();
  // phys.dispatcher = new AmmoLib.btCollisionDispatcher(phys.collisionConfiguration);
  // phys.broadphase = new AmmoLib.btDbvtBroadphase();
  // phys.solver = new AmmoLib.btSequentialImpulseConstraintSolver();
  // phys.softBodySolver = new AmmoLib.btDefaultSoftBodySolver();
  // phys.physicsWorld = new AmmoLib.btSoftRigidDynamicsWorld(
  //   phys.dispatcher,
  //   phys.broadphase,
  //   phys.solver,
  //   phys.collisionConfiguration,
  //   phys.softBodySolver
  // );
  // phys.physicsWorld.setGravity(new AmmoLib.btVector3( 0, phys.gravityConstant, 0 ));
  // phys.physicsWorld.getWorldInfo().set_m_gravity(new AmmoLib.btVector3( 0, phys.gravityConstant, 0 ));
  //
  // transformAux1 = new AmmoLib.btTransform();
}

module.exports = {
    initPhysics,
}
