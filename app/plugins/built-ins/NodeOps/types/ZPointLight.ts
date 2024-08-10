import { Light } from 'three';

export default class ZPointLight {
  private readonly _light: any;

  constructor(mesh: Light, createHelper = false) {
    mesh.intensity = 1;
    this._light = mesh;

    if (createHelper) {
      console.warn('Point light helpers not currently implemented.');
    }
  }

  getLight(intensity: number | null = null) {
    if (intensity !== null) {
      this._light.intensity = intensity;
    }
    return this._light;
  }
}
