import * as THREE from 'three';

import space from './space';
import starFieldFreeFlight from './starFieldFreeFlight';
import skyboxGenerator from './skyboxGenerator';
import galaxyMap from './galaxyMap';

let STARTING_SCREEN_WIDTH = window.innerWidth;
let STARTING_SCREEN_HEIGHT = window.innerHeight;

const logicalSceneGroup = {
  space,
  starFieldFreeFlight,
  skyboxGenerator,
  galaxyMap,
};

let activeGroup = null;

function createRenderer(id='primaryRenderer') {
  const renderer = new THREE.WebGLRenderer({
    ...$rendererParams,
    logarithmicDepthBuffer: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(
    STARTING_SCREEN_WIDTH * $displayOptions.resolutionScale,
    STARTING_SCREEN_HEIGHT * $displayOptions.resolutionScale,
  );

  renderer.shadowMap.enabled = true;
  // TODO: move into graphics are 'soft shadows'.
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // TODO: give options for shaders 'colourful' vs 'filmic'.
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // renderer.toneMapping = THREE.NoToneMapping;

  // TODO: add to graphics menu.
  // renderer.gammaOutput = true;
  // renderer.gammaFactor = 2.2;

  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.id = id;
  document.body.appendChild(renderer.domElement);

  return renderer;
}

// Calls the render functions for all active scenes.
function renderActiveScenes({ renderer, camera }) {
  if (!activeGroup) {
    return;
  }

  activeGroup.render({ renderer, camera });
}

// Calls all step functions. Note that inactive scenes will have their step
// functions called, too. This makes it possible to run a scene in background
// even when it's not being rendered (useful for ex. moving a space ship
// through space without drawing any associated visuals). Step functions are
// given a boolean value indicating whether their parent LSG is active, meaning
// they may choose to ignore the step call based on that information.
function stepAllScenes({ delta }) {
  space.step({ delta });
}

/**
 * Does scene group init prep and then sets it as active.
 * @param {import('./LogicalSceneGroup')} logicalSceneGroup
 * @param renderer
 * @param camera
 * @param {function} callback
 */
function activateSceneGroup({ logicalSceneGroup, renderer, camera, callback }) {
  if (activeGroup) {
    activeGroup.deactivate();
  }
  activeGroup = logicalSceneGroup;
  activeGroup.activate({ renderer, camera, callback });
}

export {
  logicalSceneGroup,
  createRenderer,
  renderActiveScenes,
  activateSceneGroup,
  stepAllScenes,
};
