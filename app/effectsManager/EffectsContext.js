import { GodRaysEffect, SelectiveBloomEffect } from 'postprocessing';
import EffectsManager from './EffectsManager';
import ChangeTracker from '../emitters/ChangeTracker';

export default class EffectsContext {
  constructor({ scene, camera, meta } = { scene: null, meta: null }) {
    this.scene = scene;
    this.camera = camera;
    this.rebuildTriggers = new ChangeTracker();
    this.selectiveBloom = null;
    if (meta) {
      this.meta = meta;
    }

    // This is a key:value pair, with mesh UUIDs as keys.
    this.godRaySelections = {};
  }

  addRebuildTrigger(callback) {
    console.log('[addRebuildTrigger]', {callback})
    this.rebuildTriggers.getEveryChange(callback);
  }

  getAllEffects() {
    return [
      ...Object.values(this.godRaySelections),
    ];
  }

  setSelectiveBloom({ mesh, scene, options={} }) {
    const camera = this.camera;
    this.selectiveBloom = new SelectiveBloomEffect(
      scene,
      camera,
      // {
      //   ...options,
      //   // ...EffectsManager.defaultBloomOptions,
      // }
    );
  }

  removeSelectiveBloom({ mesh, options }) {
    console.log('TBA');
  }

  /**
   * Removes selective bloom from all meshes.
   */
  clearAllSelectiveBloom() {
    console.log('TBA');
  }

  setOutline({ mesh, scene, options }) {
    console.log('TBA');
  }

  removeOutline({ mesh, options }) {
    console.log('TBA');
  }

  setGodRays({ mesh, options }) {
    const effect = new GodRaysEffect(this.camera, mesh, {
      ...EffectsManager.defaultGodRaysOptions,
      ...options,
    })

    // Something to consider: we might want to make this should be 4 when very
    // close, and 1 when far. Probably don't want to go as low as 0 because it
    // seems to foam at the mouth when the mouse moves. It's very distracting.
    // Reason we need a high number when close is because it solves an ugly
    // pixelation problem.
    effect.blurPass.kernelSize = 4;

    this.godRaySelections[mesh.uuid] = effect;
    this.rebuildTriggers.setValue(this);
  }

  removeGodRays({ mesh, options }) {
    console.log('TBA');
  }
}
