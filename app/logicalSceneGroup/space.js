import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import LogicalSceneGroup from './LogicalSceneGroup';
import levelLighting from '../lighting/levelLighting';
import spaceLighting from '../lighting/spaceLighting';
import localCluster from '../scenes/localCluster';
import { createSpaceship } from '../levelLogic/spaceshipLoader';
import physics from '../local/physics';
import { ShipPilot } from '../modeControl/cameraControllers/shipPilot';
import { FreeCam } from '../modeControl/cameraControllers/freeCam';
import contextualInput from '../local/contextualInput';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';

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

/**
 * @param scene
 * @param camera
 * @param renderer
 * @returns {EffectComposer}
 */
function setupSpaceshipPostprocessing({ scene, camera, renderer }) {
  // Postprocessing.
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Outline pass. Used for highlighting interactable objects.
  const outlinePass = new OutlinePass(
    // TODO: check if this needs recreating when window resizes.
    new THREE.Vector2(window.innerWidth / window.innerHeight), scene, camera,
  );
  outlinePass.edgeStrength = 10;
  outlinePass.edgeGlow = 1;
  outlinePass.edgeThickness = 4;
  outlinePass.pulsePeriod = 2;
  outlinePass.visibleEdgeColor = new THREE.Color(0x00ff5a);
  outlinePass.hiddenEdgeColor = new THREE.Color(0x00ff5a);
  $game.interactablesOutlinePass = outlinePass;
  composer.addPass(outlinePass);
  return composer;
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
      cache.spaceScene = localCluster.init({ font });
      cache.levelScene = new THREE.Scene();
      cache.levelScene.add(camera);
      const { spaceScene, levelScene } = cache;

      // At time of writing used only to light up interactable items.
      spaceshipEffects = setupSpaceshipPostprocessing({
        scene: levelScene,
        camera,
        renderer,
      });

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
      spaceLighting.applyLighting({ scene: spaceScene });
      levelLighting.applyLighting({ scene: levelScene });

      createSpaceship({
        scene: levelScene,
        world: spaceWorld,
        // modelName: 'minimal scene', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'monkey', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'prototype', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'DS69F', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'scorpion_d', onReady: (mesh, warpBubble, centerPoint) => {
        modelName: 'devFlyer', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'devFlyer2', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'devFlyer3', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'tentacleHull', onReady: (mesh, warpBubble, centerPoint) => {
        // modelName: 'test', onReady: (mesh, warpBubble, centerPoint) => {

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
  render: ({ renderer, camera }) => {
    renderer.autoClear = true;
    // composer.render(); // TODO: check if this works here; fix composer.
    renderer.render(cache.spaceScene, camera);
    renderer.autoClear = false;
    // clearDepth might be needed if we encounter weird clipping issues. Test me.
    // renderer.clearDepth();
    renderer.render(cache.levelScene, camera);
    if ($game.interactablesOutlinePass.selectedObjects.length) {
      // Hack to render interactables with a second scene (spaceScene). The
      // space scene will stop rendering whenever an interactable lights up,
      // so this is here only until we get a better solution.
      //
      // CAUTION: even if we find a fix to this hack, we still need to only
      // render effects when selectedObjects.length is non-zero: whenever the
      // effects processor is called, my machine's framerate drops by 60% even
      // if no effects are generated. Hopefully we find a performance fix,
      // because we'll eventually need to render more than just door switches.
      spaceshipEffects.render();
    }

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
