import * as THREE from 'three';
import LogicalSceneGroup from './LogicalSceneGroup';
import levelLighting from '../lighting/levelLighting';
import spaceLighting from '../lighting/spaceLighting';
import { getStartupEmitter, startupEvent } from '../emitters';
import localCluster from '../scenes/localCluster';
import { createSpaceShip } from '../levelLogic/spaceShipLoader';
import physics from '../local/physics';
import { ShipPilot } from '../modeControl/cameraControllers/shipPilot';
import { FreeCam } from '../modeControl/cameraControllers/freeCam';
import contextualInput from '../local/contextualInput';

const { camController, ActionType } = contextualInput;

const startupEmitter = getStartupEmitter();
const gameFont = 'node_modules/three/examples/fonts/helvetiker_regular.typeface.json';

let initAlreadyDone = false;
let spaceScene = null;
let levelScene = null;
let spaceWorld = null;
let playerShip = null;
let playerWarpBubble = null;
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

camControllers.shipPilot.init();
camControllers.freeCam.init();

function onControlChange({ next, previous }) {
  if (next === shipPilot.modeName || next === freeCam.modeName) {
    camControllers[next].onControlChange({ next, previous });
  }
}

const space = new LogicalSceneGroup({
  activate: ({ camera, callback=()=>{} }={ callback: ()=>{} }) => {
    camController.onControlChange(onControlChange);
    camController.giveControlTo('shipPilot');

    if (initAlreadyDone) {
      levelScene.add(camera);
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

    const fontLoader = new THREE.FontLoader();

    fontLoader.load(gameFont, function (font) {
      spaceScene = localCluster.init({ font });
      levelScene = new THREE.Scene();
      levelScene.add(camera);

      // This inform core that it may continue booting. It prevents unrelated
      // functionality waiting for the space ship to load, and improves boot
      // time.
      callback();

      const spaceWorld = physics.initSpacePhysics({ levelScene, debug: true });

      // TODO: replace this with a mechanism whereby this retrieved from the
      //  LSG manager. These vars are currently used by shipPilot,
      //  speedTracker, and api.setPlayerShipLocation.
      // ----------------------------------------------------------------------
      $game.spaceScene = spaceScene;
      $game.levelScene = levelScene;
      // ----------------------------------------------------------------------
      spaceLighting.applyLighting({ scene: spaceScene });
      levelLighting.applyLighting({ scene: levelScene });

      createSpaceShip({
        scene: levelScene,
        world: spaceWorld,
        // modelName: 'minimal scene', onReady: (mesh, bubble) => {
        // modelName: 'monkey', onReady: (mesh, bubble) => {
        // modelName: 'prototype', onReady: (mesh, bubble) => {
        modelName: 'DS69F', onReady: (mesh, bubble) => {
          //   modelName: 'scorpion_d', onReady: (mesh, bubble) => {
          // modelName: 'devFlyer', onReady: (mesh, bubble) => {
          // modelName: 'devFlyer2', onReady: (mesh, bubble) => {
          // modelName: 'devFlyer3', onReady: (mesh, bubble) => {
          // modelName: 'tentacleHull', onReady: (mesh, bubble) => {
          // modelName: 'test', onReady: (mesh, bubble) => {
          $game.playerShip = mesh;
          $game.playerWarpBubble = bubble;

          playerShip = mesh;
          playerWarpBubble = bubble;

          shipPilot.playerShip = mesh;
          shipPilot.playerWarpBubble = bubble;
          shipPilot.spaceScene = spaceScene;
          shipPilot.levelScene = levelScene;
          enableStep = true;

          startupEmitter.emit(startupEvent.playerShipLoaded);
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
    renderer.render(spaceScene, camera);
    renderer.autoClear = false;
    // clearDepth might be needed if we encounter weird clipping issues. Test me.
    // renderer.clearDepth();
    renderer.render(levelScene, camera);

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
