import LogicalSceneGroup from './LogicalSceneGroup';

const space = new LogicalSceneGroup({
  render: ({ renderer, camera }) => {
    renderer.render($game.levelScene, camera);
  },
});

export default space;
