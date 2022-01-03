import * as THREE from 'three';
import userProfile from '../userProfile';
import { Vector3 } from 'three';

// TODO: instance this file as a class and add this to said class.
// Shadow distance in meters.
let shadowDistanceMeters = 0;

// TODO: this colour should come from the star. Move into a class.
const color = new THREE.Color({ r: 1, g: 0.867, b: 0.815 });
const light = new THREE.DirectionalLight(color, 2);

// Applies lighting from local star. This is here and not in spaceLighting
// because in reality this lighting is all fake - this lighting is in a scene
// physically separated from the actual star's physical reality. Only a few
// meters worth of lighting / shadow info is actually calculated.
function applyLighting({ scene }) {
  $game.playerShip.getOnce(() => {
    light.castShadow = true;

    const { graphics } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });
    shadowDistanceMeters = graphics.shadowDistanceMeters;
    const shadowCamWidth = graphics.shadowDistanceMeters;
    const shadowCamHeight = graphics.shadowDistanceMeters;

    light.shadow.camera.top = shadowCamHeight;
    light.shadow.camera.bottom = -shadowCamHeight;
    light.shadow.camera.left = -shadowCamWidth;
    light.shadow.camera.right = shadowCamWidth;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = graphics.shadowDistanceMeters;
    light.shadow.bias = 0.0000125;

    // TODO: move into graphics are 'shadow quality' as a 0%-1000% value (maps
    //  from 0.0 to 100.0, where 10.0 is 100%). Notify user that higher shadow
    //  quality gets less performant the the higher shadowDistanceMeters is.
    const shadowQuality = 1.5;
    light.shadow.mapSize.width = 1024 * (graphics.shadowDistanceMeters * shadowQuality);
    light.shadow.mapSize.height= 1024 * (graphics.shadowDistanceMeters * shadowQuality);

    // TODO: move to profile.
    const drawShadowCameraBounds = false;
    if (drawShadowCameraBounds) {
      const lightHelper = new THREE.DirectionalLightHelper(light, 5);
      scene.add(lightHelper);
      const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
      scene.add(shadowHelper);
    }

    light.target.updateMatrixWorld();
    scene.add(light);
  });
}

// Update things like position relative to the sun.
function updateLighting() {
  // TODO: remove this return.
  return;
  // Note: tested and working with a real star, now we just need add this
  // file's code to EffectsManager for easier use.
  const sun = 'put actual mesh reference here.';

  // const relativeSunPosition = new Vector3();
  const sunWorldPosition = new Vector3();
  const camWorldPosition = new Vector3();

  // Align lighting with local star.
  const debugLockShadowMidpoint = false;
  sun.getWorldPosition(sunWorldPosition);

  // The below is not the cleanest code, but it works. Would be curious to see
  // if there's a more elegant solution with same or better performance.
  if (debugLockShadowMidpoint) {
    light.position.set(0, 0, 0);
    light.target.position.set(0, 0, 0);
  }
  else {
    // Working :D
    $game.camera.getWorldPosition(camWorldPosition);
    light.position.copy(camWorldPosition);
    light.target.position.copy(camWorldPosition);
  }

  light.lookAt(sunWorldPosition);
  light.target.lookAt(sunWorldPosition);
  light.translateZ(-shadowDistanceMeters / 2);
  light.target.translateZ(shadowDistanceMeters / 2);
}

export default {
  applyLighting,
  updateLighting,
}
