import LogicalSceneGroup from './LogicalSceneGroup';

const galaxyMap = new LogicalSceneGroup({
  render: ({ renderer, camera }) => {
    renderer.render($game.levelScene, camera);
  },
});

export default galaxyMap;
