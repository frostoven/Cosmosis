import * as THREE from 'three';
import LogicalSceneGroup from './LogicalSceneGroup';
import levelLighting from '../lighting/levelLighting';
import spaceLighting from '../lighting/spaceLighting';
import { getStartupEmitter, startupEvent } from '../emitters';
import { logBootInfo } from '../local/windowLoadListener';
import localCluster from '../scenes/localCluster';
import { createSpaceShip } from '../levelLogic/spaceShipLoader';
import physics from '../local/physics';
import { ShipPilot } from '../modeControl/cameraControllers/shipPilot';
import { FreeCam } from '../modeControl/cameraControllers/freeCam';
import contextualInput from '../local/contextualInput';

const { camController, ActionType } = contextualInput;

const startupEmitter = getStartupEmitter();
const gameFont = 'node_modules/three/examples/fonts/helvetiker_regular.typeface.json';

let sceneLoaded = false;
let spaceScene = null;
let levelScene = null;
let spaceWorld = null;

// TODO:
//  Remember to recreate space world (physics).
//  If your scene does not render, see bookm 414.

const camControllers = {
  shipPilot: new ShipPilot(),
  freeCam: new FreeCam(),
}
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

    if (sceneLoaded) {
      levelScene.add(camera);
      return callback();
    }

    const fontLoader = new THREE.FontLoader();

    fontLoader.load(gameFont, function (font) {
      // const startupScene = allScenes[sceneName];
      // if (!startupScene) {
      //   return console.error(`Error: default scene ${sceneName} hasn't been registered.`);
      // }
      // const scene = initScene({ font });
      spaceScene = localCluster.init({ font });
      levelScene = new THREE.Scene();
      levelScene.add(camera);

      // $game contains all the essential game variables.
      // window.$game = initView({ spaceScene, levelScene });
      // TODO: HELP.
      //  Probably have this function call back, then core can do the emit.

      // This inform core that it may continue booting. It prevents unrelated
      // functionality waiting for the space ship to load, and improves boot
      // time.
      callback();
      // startupEmitter.emit(startupEvent.gameViewReady);
      // logBootInfo('Comms relay ready');

      // initPlayer();
      // updateModeDebugText();

      // animate();
      // startupEmitter.emit(startupEvent.firstFrameRendered);
      // logBootInfo('Self-test pass');

      const spaceWorld = physics.initSpacePhysics({ levelScene, debug: true });
      // const group = new THREE.Group();
      // group.add(spaceScene);
      // group.add(levelScene);

      // TODO: replace this with a mechanism whereby we register that this LSG
      //  hosts the player ship instance, level, etc.
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
          $game.playerShipBubble = bubble;
          // TODO: Investigate why setTimeout is needed. Things break pretty hard
          //  if we have a very tiny space ship (reproducible with an empty scene
          //  containing only a camera). The exact symptom is it that
          //  startupEvent.ready is triggered before we have a scene. This leads me
          //  to believe larger space ships delay .ready long enough for the scene
          //  to load fully.
          //  TODO: with the code refactor this no longer seems to be an issue;
          //   needs additional
          // setTimeout(() => {
          startupEmitter.emit(startupEvent.playerShipLoaded);
          // });
          // logBootInfo('Ship ready');

          // Load lighting (is automatically delayed until scenes are ready).
          // spaceLighting.applyLighting({ scene: spaceScene });
          // levelLighting.applyLighting({ scene: bubble });
        }
      });
    });
  },
  deactivate: () => {
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
    shipPilot.step({ delta });
    isActive && freeCam.step({ delta });
  },
  // TODO: maybe add an 'always run' function for cases where it's not
  //  rendered.
  //  Revised thought: maybe the LSG should *always* be rendered, but the LSG
  //  should know what to step and what not to step.
});

export default space;
