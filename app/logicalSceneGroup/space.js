import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import LogicalSceneGroup from './LogicalSceneGroup';
import localCluster from '../scenes/localCluster';
import { createSpaceship } from '../levelLogic/spaceshipLoader';
import physics from '../local/physics';
import { ShipPilot } from '../modeControl/cameraControllers/shipPilot';
import { FreeCam } from '../modeControl/cameraControllers/freeCam';
import contextualInput from '../local/contextualInput';
import EffectsManager from '../effectsManager/EffectsManager';
import EffectsContext from '../effectsManager/EffectsContext';

const { camController } = contextualInput;

const gameFont = 'node_modules/three/examples/fonts/helvetiker_regular.typeface.json';
let spaceshipEffects = null;
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
/** @type EffectsManager */
let effectsManager = null;

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
  activate: ({ renderer, camera, callback=()=>{} }={ callback: ()=>{} }) => {
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
      cache.spaceScene = localCluster.init();
      cache.levelScene = new THREE.Scene();
      cache.levelScene.add(camera);
      const { spaceScene, levelScene } = cache;

    const spaceEffects = new EffectsContext({ camera, scene: spaceScene, meta: 'spaceEffects' });
    const levelEffects = new EffectsContext({ camera, scene: levelScene, meta: 'levelEffects' });

      effectsManager = new EffectsManager({
        camera,
        renderer,
        // Note: order matters here.
        effectsContexts: [ spaceEffects, levelEffects ],
      });
    $gfx.fullscreenEffects.setValue(effectsManager);
    $gfx.spaceEffects.setValue(spaceEffects);
    $gfx.levelEffects.setValue(levelEffects);

      // This inform core that it may continue booting. It prevents unrelated
      // functionality waiting for the spaceship to load, and improves boot
      // time.
      callback();

      const spaceWorld = physics.initSpacePhysics({ scene: cache.levelScene, debug: true });

      // TODO: make this work with the new ChangeTracker mechanism.
      // ----------------------------------------------------------------------
      $game.spaceScene = spaceScene;
      $game.levelScene = levelScene;
      // ----------------------------------------------------------------------

      createSpaceship({
        scene: levelScene,
        world: spaceWorld,
        // modelName: 'minimal scene', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'monkey', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'prototype', onReady: (mesh, warpBubble, centerPoint) => {
        modelName: 'DS69F', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'scorpion_d', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'devFlyer', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'devFlyer2', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'devFlyer3', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'tentacleHull', onReady: (mesh, warpBubble, centerPoint) => {

          cache.playerShip = { mesh, warpBubble, centerPoint };

          // $game.playerShip.setValue(mesh);
          // $game.playerWarpBubble = bubble;

          shipPilot.playerShip = mesh;
          shipPilot.playerWarpBubble = warpBubble;
          shipPilot.playerShipCenter = centerPoint;
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
  render: ({ delta, renderer, camera }) => {
    // let debugShowIncompleteLoadPopIn = true;
    // let ultraLowGraphics = true;

    // Render without any post-processing if:
    // * The user has enabled ultra low graphics, or:
    // * The user has enabled debugShowIncompleteLoadPopIn and the game has not
    //   finished booting.
    // let composerlessRender =
    //   ultraLowGraphics ||
    //   (!effectsManager && debugShowIncompleteLoadPopIn);

    if (!effectsManager) {
      console.warn('Waiting for effectsManager to load.');
      return;
    }

    // if (!effectsManager) {
    //   // This block allows the user to use an ultra-low graphics mode. It
    //   // basically kills all postprocessing (including switches lighting up).
    //   // User should be informed that this reduces visual queues. It's also
    //   // useful for boot-time debugging.
    // // --
    //   renderer.autoClear = true;
    //   renderer.render(cache.spaceScene, camera);
    //   renderer.autoClear = false;
    //   // clearDepth might be needed if we encounter weird clipping issues. Test
    //   // me.
    //   // renderer.clearDepth();
    //   renderer.render(cache.levelScene, camera);
    //   // --
    // }
    // else {
      effectsManager.render({ delta });
    // }
  },
  step: ({ delta, isActive }) => {
    if (!enableStep) {
      return;
    }
    shipPilot.step({ delta });
    isActive && freeCam.step({ delta });
    isActive && effectsManager.step({ delta });
  },
  // TODO: maybe add an 'always run' function for cases where it's not
  //  rendered.
  //  Revised thought: maybe the LSG should *always* be rendered, but the LSG
  //  should know what to step and what not to step.
});

export default space;
