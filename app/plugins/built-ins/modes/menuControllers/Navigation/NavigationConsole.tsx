import * as THREE from 'three';
import React from 'react';
import {
  CSS3DObject,
  CSS3DRenderer,
} from 'three/examples/jsm/renderers/CSS3DRenderer';
import Core from '../../../Core';
import Player from '../../../Player';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  player: Player,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: THREE.PerspectiveCamera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------


class NavigationConsole extends React.Component {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  navDiv: HTMLDivElement | null = null;
  navCss3dDiv: CSS3DObject | null = null;

  handleDivCreation = (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    if (this.navDiv) {
      console.error('[NavigationConsole] navDiv recreated. This is unexpected.');
    }

    this.navDiv = element;
    this.navCss3dDiv = new CSS3DObject(element);
    this.navCss3dDiv.position.set(-500, -100, 250);
    this.navCss3dDiv.rotateY(Math.PI * 0.5);
    this.navCss3dDiv.rotateX(Math.PI * -0.125);
    this.navCss3dDiv.rotateZ(Math.PI);

    const css3dRenderSpace = document.getElementById('css3d-render-space');
    if (css3dRenderSpace) {
      const scene = new THREE.Scene();
      scene.add(this.navCss3dDiv);

      const renderer = new CSS3DRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      css3dRenderSpace.appendChild(renderer.domElement);

      this._pluginCache.core.appendRenderHook(() => {
        renderer.render(scene, this._pluginCache.camera);
      });
    }
  };

  render() {
    return (
      <div ref={this.handleDivCreation}>
        <h1 style={{
          fontSize: 48,
          backgroundColor: 'pink',
          padding: 120,
        }}>
          -- Nav console --
        </h1>
      </div>
    );
  }
}

export {
  NavigationConsole,
};
