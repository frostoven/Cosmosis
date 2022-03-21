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
    this.dirLight.color.convertLinearToSRGB();
    // The stuff that makes our shadows not have absolute zero colour.
    this.ambientLight = new THREE.AmbientLight(0xbbbbbb);
    this.ambientLight.color.convertLinearToSRGB();
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

    const shadowCamWidth = shadowDistanceMeters;
    const shadowCamHeight = shadowDistanceMeters;

    const shadow = dirLight.shadow;
    const camShadow = shadow.camera;
    camShadow.top = shadowCamHeight;
    camShadow.bottom = -shadowCamHeight;
    camShadow.left = -shadowCamWidth;
    camShadow.right = shadowCamWidth;
    camShadow.near = 0.5;
    camShadow.far = shadowDistanceMeters;
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

    // Fucking gamma changes messed this up. Reassess me plz.

    // -- Dim / brighten scene based on star distance -- //

    // Reference table as compared to Earth. This is based on my own guesswork
    // and may be improved in future if some smart person can provide realistic
    // values that look good. The 'look good' part is important - I tried actual
    // physically accurate lighting from the Three.js examples and it looked
    // horrible (turns out true brightness is far too bright). The below table
    // assumes it's the middle of a bright summer's day. We'll assume the light
    // source is always white because anything beyond a certain temperature will
    // always appear white to us. Custom light colour for really dim stars will
    // be added later. Note that this applies to unfiltered light only - the user
    // may (eventually) choose to switch to false-colour, which follows a
    // hologram lighting style instead.
    //
    // legend: < dir int: directional light intensity; amb col: ambient occlusion colour >
    // dir int: 2, amb col: 0x444444: minimum brightness any sun-affected scene should ever have.
    // dir int: 2, amb col: 0x555555: little to no sunlight reaches us.
    // dir int: 2, amb col: 0x777777: inside an unlit building lobby, few windows.
    // dir int: 2, amb col: 0x888888: under thick bushes, or inside building entrance.
    // dir int: 2, amb col: 0x999999: under a tree.
    // BASE REFERENCE: dir int: 2, amb col: 0xbbbbbb: natural self-shadows under direct summer sunlight.
    // dir int: 4, amb col: 0xbbbbbb: Mercury's atmosphere.
    // dir int: 8, amb col: 0xbbbbbb: Right outside the Sun's atmosphere.
    // dir int: 10, amb col: 0xbbbbbb: Sun's atmosphere.
    // dir int: 0.5, amb col: 0x222222: Pluto's atmosphere.
    // dir int: 0.25, amb col: 0x111118: Full moon (pending review next lunar cycle).
    // dir int: 0.02, amb col: 0x222222: Deep in the dead of space. Darkest any scene may be.
    // Sunrise/sets not yet taken into account.

    // if (count++ % 120 === 0) {
    //   console.log()
    // }
  }
}
