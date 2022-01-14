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

    this.intensity = 1;
    // Directional light cast from nearby star.
    this.dirLight = new THREE.DirectionalLight(
      new THREE.Color(1, 1, 1),
      this.intensity,
    );
    // this.dirLight.color.convertLinearToSRGB();
    // The stuff that makes our shadows not have absolute zero colour.
    this.ambientLight = new THREE.AmbientLight(0xbbbbbb);
    // this.ambientLight.color.convertLinearToSRGB();
    this.applyLighting();
  }

  /**
   * Applies lighting from local star. This is here and not in spaceLighting
   * because in reality this lighting is all fake - this lighting is in a scene
   * physically separated from the actual star's physical reality. Only a few
   * meters worth of lighting / shadow info is actually calculated.
   */
  applyLighting() {
    const { scene, dirLight, ambientLight, shadowDistanceMeters } = this;
    dirLight.castShadow = this.enableShadows;

    const shadowCamWidth = this.shadowDistanceMeters;
    const shadowCamHeight = this.shadowDistanceMeters;

    const shadow = dirLight.shadow;
    const camShadow = shadow.camera;
    camShadow.top = shadowCamHeight;
    camShadow.bottom = -shadowCamHeight;
    camShadow.left = -shadowCamWidth;
    camShadow.right = shadowCamWidth;
    camShadow.near = 0.5;
    camShadow.far = this.shadowDistanceMeters;
    shadow.bias = 0.0000125;

    const shadowRes = 1024 * this.shadowDistanceMeters * this.shadowQuality;
    shadow.mapSize.width = shadowRes;
    shadow.mapSize.height = shadowRes;

    if (this.drawShadowCameraBounds) {
      const lightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
      scene.add(lightHelper);
      const shadowHelper = new THREE.CameraHelper(camShadow);
      scene.add(shadowHelper);
    }

    dirLight.target.updateMatrixWorld();
    scene.add(dirLight);
    scene.add(ambientLight);
  }

  /**
   * Update shadow position and light intensity based on angle of and distance
   star.
   */
  step() {
    const { mesh, dirLight, sunWorldPosition, camWorldPosition } = this;

    // -- Make shadows follow sun rays -- //

    // The shadow alignment is not the cleanest code, but it works. Would be
    // curious to see if there's a more elegant solution with same or better
    // performance.

    // Align lighting with local star.
    mesh.getWorldPosition(sunWorldPosition);

    if (this.debugLockShadowMidpoint) {
      dirLight.position.set(0, 0, 0);
      dirLight.target.position.set(0, 0, 0);
    }
    else {
      $game.camera.getWorldPosition(camWorldPosition);
      dirLight.position.copy(camWorldPosition);
      dirLight.target.position.copy(camWorldPosition);
    }

    dirLight.lookAt(sunWorldPosition);
    dirLight.target.lookAt(sunWorldPosition);
    dirLight.translateZ(-this.shadowDistanceMeters / 2);
    dirLight.target.translateZ(this.shadowDistanceMeters / 2);
  }
}
