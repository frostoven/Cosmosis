// @ts-ignore
import { Object3D, RectAreaLight } from 'three';
import {
  RectAreaLightHelper,
} from 'three/examples/jsm/helpers/RectAreaLightHelper';

export default class AreaLight {
  private readonly _rectLight: any;

  constructor(mesh: Object3D, createHelper = false) {
    const width = mesh.scale.x;
    const height = mesh.scale.y;
    const intensity = 5;
    const rectLight = new RectAreaLight(0xfffaa9, intensity, width, height);
    rectLight.power = 5;
    mesh.add(rectLight);
    this._rectLight = rectLight;

    if (createHelper) {
      const rectLightHelper = new RectAreaLightHelper(rectLight);
      rectLight.add(rectLightHelper);
    }
  }

  getLight(intensity: number | null = null): RectAreaLight {
    if (intensity !== null) {
      this._rectLight.intensity = intensity;
    }
    return this._rectLight;
  }
}
