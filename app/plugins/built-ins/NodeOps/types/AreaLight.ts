// @ts-ignore
import { Object3D, RectAreaLight } from 'three';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

export default class AreaLight {
  private readonly _rectLight: any;

  // TODO: the dimensions this generates is weird. Investigate.
  constructor(mesh: Object3D, createHelper=false) {
    const width = mesh.scale.x;
    const height = mesh.scale.y;
    const intensity = 1;
    const rectLight = new RectAreaLight(0xffffff, intensity, width, height);
    rectLight.position.copy(mesh.position);
    // rectLight.lookAt(0, 0, 0);
    rectLight.rotateX(-Math.PI / 2);
    // rectLight.scale.set(mesh.scale);
    this._rectLight = rectLight;

    if (createHelper) {
      const rectLightHelper = new RectAreaLightHelper(rectLight);
      rectLight.add(rectLightHelper);
    }
  }

  getLight(intensity: number | null = null) {
    if (intensity !== null) {
      this._rectLight.intensity = intensity;
    }
    return this._rectLight;
  }
}
