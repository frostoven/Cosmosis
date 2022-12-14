import { BoxGeometry, Light, Mesh, MeshStandardMaterial, SpotLightHelper } from 'three';
import { gameRuntime } from '../../../gameRuntime';

export default class ZSpotlight {
  private readonly _light: any;

  constructor(mesh: Light, createHelper=false) {
    mesh.intensity = 1;
    this._light = mesh;

    // light.castShadow = true;
    //
    // light.shadow.mapSize.width = 1024;
    // light.shadow.mapSize.height = 1024;
    //
    // light.shadow.camera.near = 500;
    // light.shadow.camera.far = 4000;
    // light.shadow.camera.fov = 30;

    if (createHelper) {
      for (let i = 0, len = mesh.children.length; i < len; i++) {
        const spotlight = mesh.children[i];

        // @ts-ignore
        const spotLightHelper = new SpotLightHelper(spotlight);

        // Three helpers unfortunately require that we add the helpers straight
        // into the root scene, and update it each frame, but we currently
        // don't properly support arbitrary scene and render hooks. As these
        // helpers are a dev function and therefore optional, we'll place it in
        // here without rigorous setup; this means that the following code may
        // fail to load if ZSpotlight is called too early.
        if (!gameRuntime.tracked?.levelScene || !gameRuntime.tracked?.core) {
          console.warn(
            '[ZSpotlight] Could not create light helper. Note that these ' +
            'helpers currently only support being loaded after core and ' +
            'levelScene are done loading.'
          );
        }
        else {
          gameRuntime.tracked?.levelScene?.getOnce(level => level.add(spotLightHelper));
          gameRuntime.tracked?.core?.getOnce((core) => core.onAnimateDone.getEveryChange(() => spotLightHelper.update()));

          // Create cube to show them shining onto something.
          const geometry = new BoxGeometry(0.25, 0.25, 0.25);
          const material = new MeshStandardMaterial({ color: 0x999999 });
          const cube = new Mesh(geometry, material);
          cube.position.copy(spotlight.position);
          spotlight.add(cube);
          cube.translateZ(-2.5);
          cube.rotateX(Math.random() * (Math.random() < 0.5 ? -1 : 1));
          cube.rotateY(Math.random() * (Math.random() < 0.5 ? -1 : 1));
          cube.rotateZ(Math.random() * (Math.random() < 0.5 ? -1 : 1));
        }
      }
    }
  }

  getLight(intensity: number | null = null) {
    if (intensity !== null) {
      this._light.intensity = intensity;
    }
    return this._light;
  }
}
