/**
 * @param {object} node
 * @param {boolean} isPlayer
 * @param level
 */
function setup(node={}, isPlayer, level) {
  if (!node.userData) {
    // This can happen with some incompatible objects. For example, cameras
    // cannot have an extras field for some reason.
    // TODO: uncomment me.
    // console.warn('meshCodeProcessor.setup: received node with no code.');
    return;
  }
  // const { position } = node;
  // const { code, target } = node.userData;
  const { code, target } = node.userData;

  switch (code) {
    case 's1': // dip switch
      node.csmTarget = target; // If this is not set, then the target it itself.
      level.createInteractable(node);
      break;
  }
}

export {
  setup,
}
