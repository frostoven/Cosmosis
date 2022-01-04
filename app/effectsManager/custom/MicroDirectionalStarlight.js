import * as THREE from 'three';

/**
 * Used to illuminate the local scene and cast shadows from a nearby star (if
 * 1.5 billion kilometers can be considered 'near'). Note that this is for
 * small scenes, such spaceships and traversable levels. This will not work
 * when attempting to cast a shadow from a planet to a moon, for example.
 */
export default class MicroDirectionalStarlight {
  constructor({
    scene, camera, mesh, star, enableShadows, shadowDistanceMeters,
    shadowQuality, drawShadowCameraBounds, debugLockShadowMidpoint,
  }) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = mesh;
    this.star = star;
    this.enableShadows = enableShadows;
    this.shadowDistanceMeters = shadowDistanceMeters;
    this.shadowQuality = shadowQuality;
    this.drawShadowCameraBounds = drawShadowCameraBounds;
    this.debugLockShadowMidpoint = debugLockShadowMidpoint;

    this.sunWorldPosition = new THREE.Vector3();
    this.camWorldPosition = new THREE.Vector3();

    // const { r, g, b } = star.K;
    this.light = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 2);
    this.applyLighting();
  }

  /**
   * Applies lighting from local star. This is here and not in spaceLighting
   * because in reality this lighting is all fake - this lighting is in a scene
   * physically separated from the actual star's physical reality. Only a few
   * meters worth of lighting / shadow info is actually calculated.
   */
  applyLighting() {
    const { scene, light, shadowDistanceMeters } = this;
    light.castShadow = this.enableShadows;

    const shadowCamWidth = this.shadowDistanceMeters;
    const shadowCamHeight = this.shadowDistanceMeters;

    light.shadow.camera.top = shadowCamHeight;
    light.shadow.camera.bottom = -shadowCamHeight;
    light.shadow.camera.left = -shadowCamWidth;
    light.shadow.camera.right = shadowCamWidth;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = this.shadowDistanceMeters;
    light.shadow.bias = 0.0000125;

    const shadowRes = 1024 * this.shadowDistanceMeters * this.shadowQuality;
    light.shadow.mapSize.width = shadowRes;
    light.shadow.mapSize.height = shadowRes;

    if (this.drawShadowCameraBounds) {
      const lightHelper = new THREE.DirectionalLightHelper(light, 5);
      scene.add(lightHelper);
      const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
      scene.add(shadowHelper);
    }

    light.target.updateMatrixWorld();
    scene.add(light);
  }

  /**
   * Update shadow position and light intensity based on angle of and distance
   star.
   */
  step() {
    const { light, sunWorldPosition, camWorldPosition } = this;

    // The rest of this function is not the cleanest code, but it works. Would
    // be curious to see if there's a more elegant solution with same or better
    // performance.

    // Align lighting with local star.
    this.mesh.getWorldPosition(sunWorldPosition);

    if (this.debugLockShadowMidpoint) {
      light.position.set(0, 0, 0);
      light.target.position.set(0, 0, 0);
    }
    else {
      $game.camera.getWorldPosition(camWorldPosition);
      light.position.copy(camWorldPosition);
      light.target.position.copy(camWorldPosition);
    }

    light.lookAt(sunWorldPosition);
    light.target.lookAt(sunWorldPosition);
    light.translateZ(-this.shadowDistanceMeters / 2);
    light.target.translateZ(this.shadowDistanceMeters / 2);
  }
}
