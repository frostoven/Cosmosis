import { GodRaysEffect, SelectiveBloomEffect } from 'postprocessing';
import EffectsManager from './EffectsManager';
import ChangeTracker from '../emitters/ChangeTracker';
import MicroDirectionalStarlight from './custom/MicroDirectionalStarlight';
import userProfile from '../userProfile';

/**
 * Deals with scene- and object-specific effects. These include post-processing
 * and general (non-post-processing) lighting effects.
 */
export default class EffectsContext {
  constructor({ scene, camera, meta } = { scene: null, meta: null }) {
    /**
     * This class currently focuses on any star near enough to emit light. It
     * controls the directional as well as the ambient light within a scene. It
     * has the following todo:
     *  * Indicate windows and doors within spacecraft. This allows us to
     *    adjust ambient light based on surroundings (such as a nearby blue
     *    planet offering a blue sheen) and darken ambient light spontaneously
     *    (ex. when the doorway leading to the only outside window has shut).
     *  * Understand when we're on a planet, and take sun position / whether or
     *    not we're in a building into account.
     *  * Understand when we're under a full moon night sky, and offer display
     *    options to activate rods / cones rendering: cones-rendering means we
     *    can see colours normally. Rods (believe it or not) are colourblind
     *    and responsible for night vision in humans, which is why roses look
     *    blue under moonlight; thus, rods-rendering (should the user keep it
     *    enabled) means colour will gain a silver-blue sheen in low-light
     *    areas.
     */

    this.scene = scene;
    this.camera = camera;
    this.rebuildTriggers = new ChangeTracker();
    this.selectiveBloom = null;
    if (meta) {
      this.meta = meta;
    }

    // Contains { meshId: ID, fn: callback } objects for effects that needs step
    // functionality.
    this.stepListeners = [];
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

  addStepListener({ uuid, fn } = {}) {
    if (!uuid || !fn) {
      return console.error(
        'registerStepListener requires an object in the format ' +
        '{ uuid: "mesh id", fn: callback }',
      );
    }

    this.stepListeners.push({ uuid, fn });
  }

  removeStepListener({ uuid }) {
    const listeners = this.stepListeners;
    let i = listeners.length;
    while (i--) {
      const item = listeners[i];
      if (item.uuid === uuid) {
        item.splice(i, 1);
      }
    }
  }

  step({ delta }) {
    const callbacks = [];
    const listeners = this.stepListeners;
    for (let i = 0; i < listeners.length; i++) {
      // Prevents index deletion issues in cases where the event loop splits
      // off.
      callbacks.push(listeners[i].fn);
    }

    // Call all step callbacks.
    for (let i = 0, len = callbacks.length; i < len; i++) {
      const fn = callbacks[i];
      fn(({ delta }));
    }
  }

  /**
   * Used to illuminate the local scene and cast shadows from a nearby star (if
   * 1.5 billion kilometers can be considered 'near'). Note that this is for
   * small scenes, such spaceships and traversable levels. This will not work
   * when attempting to cast a shadow from a planet to a moon, for example.
   * @param mesh
   * @param star
   * @param scene
   * @param options
   */
  setMicroDirectionalStarlight({ mesh, star, options={} }) {
    $game.playerShip.getOnce((ship) => {
      userProfile.cacheChangeEvent.getOnce(({ userOptions }) => {
        const effect = new MicroDirectionalStarlight({
          ...{
            mesh,
            star,
            // There's a problem of ambiguity here. The fact that we ignore
            // this.scene and instead look up the player ship means that this
            // function is technically scene agnostic. This would usually mean
            // it belongs to EffectsManager, but EffectsManager currently
            // handles only mesh-agnostic setups, which this function isn't.
            // Unsure yet if this is a problem technically / logically.
            scene: ship.centerPoint,
            camera: this.camera,
            enableShadows: userOptions.graphics.enableShadows,
            shadowDistanceMeters: userOptions.graphics.shadowDistanceMeters,
            shadowQuality: userOptions.graphics.shadowQuality,
            drawShadowCameraBounds: userOptions.debug.drawShadowCameraBounds,
            debugLockShadowMidpoint: userOptions.debug.debugLockShadowMidpoint,
          },
          ...options,
        });

        this.addStepListener({
          uuid: mesh.uuid,
          fn: () => effect.step(),
        });
      });
    });
  }

  /**
   * Used to cast shadows from moons to planets and vice-versa.
   * @param mesh
   * @param scene
   * @param options
   */
  setTerraDirectionalStarlight({ mesh, scene, options={} }) {
    console.log('TBA');
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
    });

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
