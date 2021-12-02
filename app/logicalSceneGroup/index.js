import * as THREE from 'three';

import space from './space';
import starFieldFreeFlight from './starFieldFreeFlight';
import skyboxGenerator from './skyboxGenerator';
import galaxyMap from './galaxyMap';

const logicalSceneGroup = {
  space,
  starFieldFreeFlight,
  skyboxGenerator,
  galaxyMap,
};

let activeGroup = null;

// Calls the render functions for all active scenes.
function renderActiveScenes({ renderer, camera }) {
  if (!activeGroup) {
    return;
  }

  activeGroup.render({ renderer, camera });
}

// Calls all step functions. Note that inactive scenes will have their step
// functions called, too. This makes it possible to run a scene in background
// even when it's not being rendered (useful for ex. moving a spaceship
// through space without drawing any associated visuals). Step functions are
// given a boolean value indicating whether their parent LSG is active, meaning
// they may choose to ignore the step call based on that information.
function stepAllScenes({ delta }) {
  space.step({ delta, isActive: activeGroup === space });
  starFieldFreeFlight.step({ delta, isActive: activeGroup === starFieldFreeFlight });
}

/**
 * Does scene group init prep and then sets it as active.
 * @param {import('./LogicalSceneGroup')} logicalSceneGroup
 * @param renderer
 * @param camera
 * @param {function} callback
 */
function activateSceneGroup({ logicalSceneGroup, renderer, camera, callback }) {
  if (activeGroup === logicalSceneGroup) {
    // Scene already active. Do nothing.
    return;
  }
  if (activeGroup) {
    activeGroup.deactivate({ renderer, camera });
  }
  activeGroup = logicalSceneGroup;
  activeGroup.activate({ renderer, camera, callback });
}

export {
  logicalSceneGroup,
  renderActiveScenes,
  activateSceneGroup,
  stepAllScenes,
};
