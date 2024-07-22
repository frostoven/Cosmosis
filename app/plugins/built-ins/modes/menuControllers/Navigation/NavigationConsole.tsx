import * as THREE from 'three';
import React from 'react';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Core from '../../../Core';
import Player from '../../../Player';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import { Html3dRenderer } from '../../../Html3dRenderer';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  player: Player,
  html3dRenderer: Html3dRenderer,
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
  navCss3dObject: CSS3DObject | null = null;

  componentWillUnmount() {
    if (this.navCss3dObject) {
      this._pluginCache.html3dRenderer.remove(this.navCss3dObject);
    }
  }

  handleDivCreation = (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    if (this.navDiv) {
      console.error('[NavigationConsole] navDiv recreated. This is unexpected.');
    }

    this.navDiv = element;
    this.navCss3dObject = new CSS3DObject(element);
    this.navCss3dObject.position.set(-500, -300, -250);
    this.navCss3dObject.rotateY(Math.PI * 0.5);
    this.navCss3dObject.rotateX(Math.PI * -0.125);

    this._pluginCache.html3dRenderer.add(this.navCss3dObject);
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
