import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import LogicalSceneGroup from './LogicalSceneGroup';
import levelLighting from '../lighting/levelLighting';
import spaceLighting from '../lighting/spaceLighting';
import localCluster from '../scenes/localCluster';
import { createSpaceShip } from '../levelLogic/spaceShipLoader';
import physics from '../local/physics';
import { ShipPilot } from '../modeControl/cameraControllers/shipPilot';
import { FreeCam } from '../modeControl/cameraControllers/freeCam';
import contextualInput from '../local/contextualInput';

const { camController } = contextualInput;

const gameFont = 'node_modules/three/examples/fonts/helvetiker_regular.typeface.json';

let initAlreadyDone = false;
// let spaceWorld = null;
const cache = {
  playerShip: null,
  spaceScene: null,
  levelScene: null,
};
// If false, no shipPilot or freeCam processing will take place. This is
// usually set to true after completely loading.
let enableStep = false;

let lastActiveCamData = null;

// TODO:
//  Remember to recreate space world (physics).
//  If your scene does not render, see bookm 414.

const camControllers = {
  shipPilot: new ShipPilot(),
  freeCam: new FreeCam(),
};
const { shipPilot, freeCam } = camControllers;

function onControlChange({ next, previous }) {
  if (next === shipPilot.modeName || next === freeCam.modeName) {
    camControllers[next].onControlChange({ next, previous });
  }
}

const space = new LogicalSceneGroup({
  activate: ({ camera, callback=()=>{} }={ callback: ()=>{} }) => {
    camControllers.shipPilot.replaceKeyListeners();
    camControllers.freeCam.replaceKeyListeners();

    camController.onControlChange(onControlChange);
    camController.giveControlTo('shipPilot');

    if (initAlreadyDone) {
      cache.levelScene.add(camera);
      if (lastActiveCamData) {
        // TODO: this does not entirely fix the camera; it only partially fixes
        //  it (rotation is a tad off). Investigate a fix.
        camera.position.copy(lastActiveCamData.position);
        camera.rotation.copy(lastActiveCamData.rotation);
        lastActiveCamData = null;
      }
      return callback();
    }
    initAlreadyDone = true;

    const fontLoader = new FontLoader();

    fontLoader.load(gameFont, function (font) {
      cache.spaceScene = localCluster.init({ font });
      cache.levelScene = new THREE.Scene();
      cache.levelScene.add(camera);
      const { spaceScene, levelScene } = cache;

      // This inform core that it may continue booting. It prevents unrelated
      // functionality waiting for the space ship to load, and improves boot
      // time.
      callback();

      const spaceWorld = physics.initSpacePhysics({ scene: cache.levelScene, debug: true });

      // TODO: replace this with a mechanism whereby this retrieved from the
      //  LSG manager. These vars are currently used by shipPilot,
      //  speedTracker, and api.setPlayerShipLocation.
      // ----------------------------------------------------------------------
      $game.spaceScene = spaceScene; // TODO: bookm playership - you're next, bitch.
      $game.levelScene = levelScene;
      // ----------------------------------------------------------------------
      spaceLighting.applyLighting({ scene: spaceScene });
      levelLighting.applyLighting({ scene: levelScene });

      //
      // TODO: rename all occurences of spaceShip to spaceship. Nice fuckup btw.
      //
      createSpaceShip({
        scene: levelScene,
        world: spaceWorld,
        // modelName: 'minimal scene', onReady: (mesh, bubble) => {
        // modelName: 'monkey', onReady: (mesh, bubble) => {
        // modelName: 'prototype', onReady: (mesh, bubble) => {
        modelName: 'DS69F', onReady: (mesh, warpBubble) => {
        // modelName: 'scorpion_d', onReady: (mesh, bubble) => {
        // modelName: 'devFlyer', onReady: (mesh, bubble) => {
        // modelName: 'devFlyer2', onReady: (mesh, bubble) => {
        // modelName: 'devFlyer3', onReady: (mesh, bubble) => {
        // modelName: 'tentacleHull', onReady: (mesh, bubble) => {
        // modelName: 'test', onReady: (mesh, bubble) => {

          cache.playerShip = { mesh, warpBubble };

          // $game.playerShip.setValue(mesh);
          // $game.playerWarpBubble = bubble;

          shipPilot.playerShip = mesh;
          shipPilot.playerWarpBubble = warpBubble;
          shipPilot.spaceScene = spaceScene;
          shipPilot.levelScene = levelScene;
          enableStep = true;

          window.$game.playerShip.setValue(cache.playerShip);
        }
      });
    });
  },
  deactivate: () => {
    lastActiveCamData = {
      position: $game.camera.position,
      rotation: $game.camera.rotation,
    };
    camController.removeControlListener(onControlChange);
  },
  render: ({ renderer, camera }) => {
    renderer.autoClear = true;
    // composer.render(); // TODO: check if this works here; fix composer.
    renderer.render(cache.spaceScene, camera);
    renderer.autoClear = false;
    // clearDepth might be needed if we encounter weird clipping issues. Test me.
    // renderer.clearDepth();
    renderer.render(cache.levelScene, camera);

    levelLighting.updateLighting();
    spaceLighting.updateLighting();
  },
  step: ({ delta, isActive }) => {
    if (!enableStep) {
      return;
    }
    shipPilot.step({ delta });
    isActive && freeCam.step({ delta });
  },
  // TODO: maybe add an 'always run' function for cases where it's not
  //  rendered.
  //  Revised thought: maybe the LSG should *always* be rendered, but the LSG
  //  should know what to step and what not to step.
});

export default space;
