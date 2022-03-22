import * as THREE from 'three';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  BlendFunction,
  KernelSize,
} from 'postprocessing';
import userProfile from '../userProfile';

/**
 * Manages fullscreen effects (mostly post-processing). Does not directly deal
 * with scene-specific effects, although those may be passed in as
 * EffectsContext objects.
 */
export default class EffectsManager {

  static defaultFullscreenBloomOptions = {
    blendFunction: BlendFunction.SCREEN,
    height: 480,
    kernelSize: KernelSize.MEDIUM,
    luminanceSmoothing: 0.1,
    // 1 means off, 0 means full. 0.3-0.4 are good overall values.
    luminanceThreshold: 1,
  };

  static defaultMicroDirectionalStarlight = {
    // Star format as prescribed by https://github.com/frostoven/BSC5P-JSON-XYZ
    star: { K: { r: 1, g: 0.24, b: 0.067 } }, // Colour temperature, Kelvin.
    enableShadows: true,
    shadowDistanceMeters: 5,
    shadowQuality: 0.5,
    drawShadowCameraBounds: false,
    debugLockShadowMidpoint: false,
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

    const { debug } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });

    for (let i = 0; i < effectsContexts.length; i++) {
      /** @link EffectsContext */
      const context = effectsContexts[i];
      context.addRebuildTrigger(() => {this.rebuildComposer()});
    }

    if (debug.debugEnableFullscreenBloom) {
      this.setFullscreenBloom();
    }

    this.rebuildComposer();
  }

  get composer() {
    return this._composer;
  }

  set composer(undef) {
    throw 'EffectsManager.composer is read-only.';
  }

  /**
   * Should be invoked as an alternative to scene rendering.
   * @param delta
   */
  render({ delta }) {
    if (this._composer) {
      this._composer.render(delta);
    }
  }

  /**
   * Animation frame processing not directly related to rendering.
   * @param delta
   */
  step({ delta }) {
    const effectsContexts = this._contexts;
    for (let i = 0; i < effectsContexts.length; i++) {
      const context = effectsContexts[i];
      context.step({ delta });
    }
  }

  /**
   * Discards existing composer and builds a new one from scratch.
   */
  rebuildComposer() {
    const renderer = this.renderer;
    const camera = this.camera;
    const effectComposer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    effectComposer.renderer.outputEncoding = THREE.sRGBEncoding;
    effectComposer.renderer.gammaFactor = 2.2;
    effectComposer.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const postEffects = [];

    // extra reading on passes:
    // https://github.com/vanruesc/postprocessing/issues/123

    // Add all scenes. These need to be first in the render order, or else
    // things get erased and never render.
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

    effectPass.renderToScreen = true;

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
