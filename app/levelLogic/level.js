import * as THREE from 'three';

// Distance in meters the players needs to be from an object to interact with it.
const ACTION_DIST = 1;

/**
 * The term 'level' here is used very loosely. It's any interactable
 * environment. Space ships as well planet sectors count as levels. Note that
 * only *your own* ship is a level - another players ship is not interactable
 * and just a prop in your world.
 * @constructor
 */
export default function Level(mesh) {
  this.mesh = mesh;
  this._mixer = new THREE.AnimationMixer(mesh.scene);
  this._clips = mesh.animations;
  this.interactables = [];
  this._useNext = false;
  // Array of animation actions.
  // this._animating = [];
  this._animating = {};
}

/**
 * Creates an object who's position is constantly tracked relative to player
 * location. This happens because we need visual queues for when we can
 * interact with something.
 *
 * Dev note: I'm doubtful we'll run into performance issues here, but if we
 * do (like maybe in very large areas with many interactables) we could
 * consider breaking them into sub-sectors. This would require indicating
 * partitions in Blender.
 */
Level.prototype.createInteractable = function createInteractable(node) {
  this.interactables.push(node);
  // console.log('==> Level interactables:', this.interactables);
};

// Creates an action that runs once, then stops.
Level.prototype.createAction = function createAction(clip, clipName) {
  const action = this._mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 0);
  action.clampWhenFinished = true;
  this._animating[clipName] = action;
  // action.time = 2; // used make the object jump to a specific time frame.
  return action;
}

// Starts an animation. If the animation has run before, reverses direction and
// starts it again.
Level.prototype.triggerAnimation = function triggerAnimation(action) {
  // TODO: not all animations are moving meshes. For example, a computer
  //  terminal will launch an interface. Make this function take that into
  //  account.
  action.play();
  if (action.paused) {
    // This animation has already completed and the player interacting
    // a second time. Reverse the animation.
    action.timeScale = action.timeScale === 1 ? -1 : 1;
    action.paused = false;
  }
}

/**
 * Does all level processing.
 */
Level.prototype.process = function process(delta) {
  const tmpVec3 = new THREE.Vector3(0, 0, 0);
  // console.log('**** dist to ship:', levelPos.distanceTo($game.camera.position));
  // const relPos = levelPos.distanceTo($game.camera.position);
  for (let i = 0, len = this.interactables.length; i < len; i++) {
    const node = this.interactables[i];
    node.getWorldPosition(tmpVec3);
    const dist = tmpVec3.distanceTo($game.camera.position);
    if (dist <= ACTION_DIST) {
      // console.log(`**** dist to ${node.name}:`, dist);
      $game.outlinePass.selectedObjects = [node];
      if (this._useNext) {
        let clip;
        // Switches have targets, which are other 3D objects. Items like chairs
        // do not have targets, so they themselves are the targets.
        let clipName = node.csmTarget ? node.csmTarget : node.name;
        console.log('INTERACTING WITH NODE:', clipName);

        // Action cache.
        let action = this._animating[clipName];
        if (action) {
          this.triggerAnimation(action);
        }
        else {
          clip = THREE.AnimationClip.findByName(this._clips, clipName);
          if (clip) {
            const action = this.createAction(clip, clipName);
            this.triggerAnimation(action);
          }
          else {
            console.warn('Level.process: could not find animation', clipName);
          }
        }
      }
    }
    else {
      $game.outlinePass.selectedObjects = [];
    }
    this._useNext = false;
  }
  this.runAnimations(delta);
}

let stop = 0;
Level.prototype.runAnimations = function runAnimations(delta) {
  this._mixer.update(delta);
  // if (stop++ === 60) {
  //   console.log('The illusive mixer:', this._mixer);
  // }
}

Level.prototype.setNameMap = function setNameMap(map) {
  this.nameMap = map;
}

Level.prototype.useNext = function useNext() {
  this._useNext = true;
}
