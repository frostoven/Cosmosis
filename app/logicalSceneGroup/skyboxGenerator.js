import LogicalSceneGroup from './LogicalSceneGroup';
import starFieldFreeFlight from './starFieldFreeFlight';

const skyboxGenerator = new LogicalSceneGroup({
  activate: starFieldFreeFlight.activate,
  deactivate: starFieldFreeFlight.deactivate,
  render: ({ renderer, camera }) => {
    renderer.render($game.levelScene, camera);
  },
});

export default skyboxGenerator;
