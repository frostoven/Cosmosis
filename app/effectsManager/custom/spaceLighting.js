import * as THREE from 'three';

// Applies lighting for all celestial bodies.
// TODO: apply shadows to moons from their host planets somehow.
function applyLighting({ scene }) {
  $game.playerShip.getOnce(() => {
    // 1.5 is technically too high, but this should eventually be handled
    // mathematically by auto-exposure (and user overrides) so we can discard
    // realism for now in favour of prettiness and let the future dynamic
    // lighting systems deal with this appropriately.
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.castShadow = false;

    // TODO: make this dynamically adjust depending on proximity to whatever planet we're close to.
    //  Snap positions to a 90 degree and head-on for whatever planet we're looking at and it closer.
    //  Do not adjust lighting target once planet is replaced with sprite.
    //  God dammit the insane hax that need to be tuned. So. much. work.
    light.position.set(0, 1, 0);
    light.target.position.set(0, 1, 0);

    light.target.updateMatrixWorld();
    scene.add(light);

    debug.spaceLights = { light };
  });
}

// Update things like position relative to the sun.
function updateLighting() {
  // TODO: move this positioning into a celestial body manager.
  // const sunPosition = new THREE.Vector3(149961697593, -384342478, 224789015);
  // light.lookAt(sunPosition);
  // light.target.lookAt(sunPosition);
}

export default {
  applyLighting,
  updateLighting,
}
