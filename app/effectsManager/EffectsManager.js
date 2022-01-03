import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  BlendFunction,
  KernelSize,
} from 'postprocessing';

export default class EffectsManager {

  static defaultFullscreenBloomOptions = {
    blendFunction: BlendFunction.SCREEN,
    height: 480,
    kernelSize: KernelSize.MEDIUM,
    luminanceSmoothing: 0.1,
    // 1 means off, 0 means full. 0.3-0.4 are good overall values.
    luminanceThreshold: 1,
  };

  static defaultGodRaysOptions = {
    clampMax: 1.0,
    decay: 0.92,
    density: 0.96,
    exposure: 0.54,
    height: 240,
    kernelSize: KernelSize.SMALL,
    samples: 60,
    weight: 0.3,
  };

  constructor({ renderer, camera, effectsContexts }) {
    this.renderer = renderer;
    this.camera = camera;
    this._contexts = effectsContexts;
    this._composer = null;

    for (let i = 0, len = effectsContexts.length; i < len; i++) {
      /** @link EffectsContext */
      const context = effectsContexts[i];
      context.addRebuildTrigger(() => {this.rebuildComposer()});
    }

    this.setFullscreenBloom();

    this.rebuildComposer();
  }

  get composer() {
    return this._composer;
  }

  set composer(undef) {
    throw 'EffectsManager.composer is read-only.';
  }

  rebuildComposer() {
    const renderer = this.renderer;
    const camera = this.camera;
    const effectComposer = new EffectComposer(renderer);

    const postEffects = [];

    // Add all scenes. These need to be first in the render order, or else
    // things things get erased and never render.
    const contexts = this._contexts;
    for (let i = 0, len = contexts.length; i < len; i++) {
      /** @link EffectsContext */
      const ctx = contexts[i];
      console.log('xxx> [rebuildComposer] processing', ctx.meta);
      const pass = new RenderPass(ctx.scene, camera);
      // This insures that clear=true on the first scene only. Without this,
      // only the last scene gets rendered.
      pass.clear = i === 0;
      effectComposer.addPass(pass);

      // Save postprocessing effects for later.
      postEffects.push(ctx.getAllEffects());
    }

    // Add fullscreen effects.
    const combinedEffects = [];
    this.fullscreenBloom && combinedEffects.push(this.fullscreenBloom);

    // Add all postprocessing effects.
    for (let i = 0, len = postEffects.length; i < len; i++) {
      const effects = postEffects[i];
      for (let j = 0, len = effects.length; j < len; j++) {
        const effect = effects[j];
        combinedEffects.push(effect);
      }
    }

    const effectPass = new EffectPass(
      camera,
      ...combinedEffects,
    );
    effectPass.clear = false;
    effectComposer.addPass(effectPass);

    this._composer = effectComposer;
  }

  setFullscreenBloom({ options={} } = { options: {} }) {
    this.fullscreenBloom = new BloomEffect(
      {
        ...EffectsManager.defaultFullscreenBloomOptions,
        ...options,
      }
    );
  }

  removeFullscreenBloom({ options={} }) {
    console.log('TBA');
  }
}
