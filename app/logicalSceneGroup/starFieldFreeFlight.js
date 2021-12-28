import LogicalSceneGroup from './LogicalSceneGroup';
import distantStars from '../scenes/distantStars';
import contextualInput from '../local/contextualInput';
import { FreeCam } from '../modeControl/cameraControllers/freeCam';
import { createSpaceship } from '../levelLogic/spaceshipLoader';
import AssetFinder from '../local/AssetFinder';
import fs from 'fs';

const { camController } = contextualInput;
let starFieldScene = null;

const freeCam = new FreeCam();

function onControlChange({ next, previous }) {
  if (next === freeCam.modeName) {
    freeCam.onControlChange({ next, previous });
  }
}

const starFieldFreeFlight = new LogicalSceneGroup({
  activate: ({ camera, renderer, callback=()=>{} }={ callback: ()=>{} }) => {
    freeCam.replaceKeyListeners();
    camController.onControlChange(onControlChange);
    renderer.autoClear = true;
    const gl = renderer.context;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_COLOR);

    AssetFinder.getStarCatalogWFallback({
      name: 'bsc5p_3d_min',
      fallbackName: 'constellation_test',
      callback: (error, fileName, parentDir) => {
        fs.readFile(`./${parentDir}/${fileName}`, (error, catalogBlob) => {
          if (error) {
            console.error('Fata error loading star catalog:', error);
          }
          else {
            if (!starFieldScene) {
              starFieldScene = distantStars.init({
                catalogJson: JSON.parse(catalogBlob),
              });
            }

            starFieldScene.add(camera);
            camController.giveControlTo('freeCam');

            // TODO: figure out what needs this and eliminate it.
            $game.spaceScene = starFieldScene;
            $game.levelScene = starFieldScene;

            callback();

            // We unfortunately need some form of mesh in order for the game to set
            // up / center itself.
            createSpaceship({
              scene: starFieldScene,
              modelName: 'minimal scene', onReady: (mesh, warpBubble) => {
                // TODO: this is not the player ship though - it's just a
                //  reference. This is likely unneeded. Investigate.
                $game.playerShip.setValue({
                  mesh, warpBubble,
                });
              }
            });
          }
        });
      }
    });
  },
  deactivate: ({ renderer, callback=()=>{} }={ callback: ()=>{} }) => {
    camController.removeControlListener(onControlChange);
    const gl = renderer.context;
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    callback();
    starFieldScene = null;
  },
  render: ({ renderer, camera }) => {
    renderer.render(starFieldScene, camera);
  },
  step: ({ delta, isActive }) => {
    if (!isActive) {
      return;
    }
    freeCam.step({ delta });
  },
});

export default starFieldFreeFlight;
