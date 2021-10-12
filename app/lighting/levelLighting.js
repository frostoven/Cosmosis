import { startupEvent, getStartupEmitter } from '../emitters';
import * as THREE from 'three';

const startupEmitter = getStartupEmitter();

// Applies lighting from local star. This is here and not in spaceLighting
// because in reality this lighting is all fake - this lighting is in a scene
// physically separated from the actual star's physical reality. Only a few
// meters worth of lighting / shadow info is actually calculated.
function applyLighting() {
  startupEmitter.on(startupEvent.playerShipLoaded, () => {
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.castShadow = true;

    // TODO: move into graphics menu as 'horizontal shadow distance (in meters)'.
    const shadowCamWidth = 3;
    const shadowCamHeight = 3;

    light.shadow.camera.top = shadowCamHeight;
    light.shadow.camera.bottom = -shadowCamHeight;
    light.shadow.camera.left = -shadowCamWidth;
    light.shadow.camera.right = shadowCamWidth;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 5;
    // ^^ ?
    // TODO: move to graphics as 'vertical shadow distance (meters)'
    // const shadowDistanceVertically = 1.5;

    light.position.set(0, 3.5, 0);
    // Note: target should *not* be used to adjust distance. Use camera.far for
    // that.
    light.target.position.set(0, 1, 0);

    // TODO: move into graphics are 'shadow resolution'.
    light.shadow.mapSize.width = 1024 * 4;
    light.shadow.mapSize.height= 1024 * 4;

    const bubble = $game.playerShipBubble;

    // const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // bubble.add(lightHelper);
    // const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
    // bubble.add(shadowHelper);

    light.target.updateMatrixWorld();
    bubble.add(light);

    debug.levelLights = { light };
  });
}

// Update things like position relative to the sun.
function updateLighting() {
  // TODO: move this positioning into a celestial body manager.
  const sunPosition = new THREE.Vector3(149961697593, -384342478, 224789015);
  // light.lookAt(sunPosition);
  // light.target.lookAt(sunPosition);
}

export default {
  applyLighting,
  updateLighting,
}
