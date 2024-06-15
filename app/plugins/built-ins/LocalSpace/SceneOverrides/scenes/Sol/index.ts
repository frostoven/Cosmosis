import * as THREE from 'three';
import {
  PlanetarySystemDefinition,
} from '../../../../../../celestialBodies/bodyTypes/PlanetarySystemDefinition';
import { SceneOverride } from '../../SceneOverride';
import { Sun } from './Sun';
import { Saturn } from './Saturn';
import PluginCacheTracker from '../../../../../../emitters/PluginCacheTracker';
import Core from '../../../../Core';

type PluginCompletion = PluginCacheTracker | {
  core: Core,
};

class Sol /*extends SceneOverride*/ {
  constituents: PlanetarySystemDefinition;
  private _pluginCache: PluginCompletion;
  private _ready = false;

  constructor(parentScene: THREE.Scene) {
    this.constituents = new PlanetarySystemDefinition(parentScene);
    this._pluginCache = new PluginCacheTracker([ 'core' ]);

    this._pluginCache.onAllPluginsLoaded.getOnce(() => {
      this._pluginCache.core.onAnimate.getEveryChange(this.step);
    });
  }

  // Inits the system, adds everything the parent scene, and starts the render
  // loop.
  activate() {
    this.constituents.mainStar = new Sun();
    // this.constituents.planets.push(new Saturn());
    this.constituents.addAllToScene();
    this._ready = true;
  }

  step = () => {
    if (!this._ready) {
      return;
    }

    const { j2000Time } = Core.animationData;
    this.constituents.step(j2000Time);
  };
}

export {
  Sol,
};
