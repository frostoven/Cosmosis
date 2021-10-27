import LogicalSceneGroup from './LogicalSceneGroup';

const starFieldFreeFlight = new LogicalSceneGroup({
  activate: ({ renderer, callback=()=>{} }={ callback: ()=>{} }) => {
    const gl = renderer.context;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_COLOR);

    // TODO: take exclusive key control and switch to flight cam.

    callback();
  },
  deactivate: ({ renderer, callback=()=>{} }={ callback: ()=>{} }) => {
    const gl = renderer.context;
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    callback();
  },
  render: ({ renderer, camera }) => {
    if (!renderer) return;

    renderer.render($game.levelScene, camera);
  },
});

export default starFieldFreeFlight;
