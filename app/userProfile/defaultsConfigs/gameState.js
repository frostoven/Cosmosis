// The actual save-game file.
const gameState = {
  info: {
    name: 'gameState',
    fileName: 'gameState.json',
  },
  fileContent: {
    // Note: saving of position not yet implemented, though this will still
    // work if manually set.
    currentPosition: {
      location: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 2, z: 0 },
    },
  },
};

export default gameState;
