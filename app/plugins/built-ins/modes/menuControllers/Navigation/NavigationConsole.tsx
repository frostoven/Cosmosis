import * as THREE from 'three';
import React from 'react';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Core from '../../../Core';
import Player from '../../../Player';
import PluginCacheTracker from '../../../../../emitters/PluginCacheTracker';
import { Html3dRenderer } from '../../../Html3dRenderer';
import { NavTabs } from './components/NavTabs';
import {
  RegisteredMenu,
} from '../../../ReactBase/types/compositionSignatures';

const navConsoleStyle: React.CSSProperties = {
  width: 640,
  height: 320,
  position: 'relative',
  backgroundColor: '#ffbe0003',
};

const noiseStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

const noiseForegroundStyle: React.CSSProperties = {
  ...noiseStyle,
  background: 'url(/prodHqAssets/noise/static.png)',
};

const noiseBackgroundStyle: React.CSSProperties = {
  ...noiseStyle,
  overflow: 'hidden',
};

const noiseBackgroundImage: React.CSSProperties = {
  ...noiseStyle,
  backgroundColor: 'rgba(33, 33, 37, 0.5)',
  background: 'url(/prodHqAssets/noise/static_interference_blurred.png)',
  height: '200%',
  backdropFilter: 'blur(17px)',
};

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

interface Props {
  pluginOptions: RegisteredMenu,
}

class NavigationConsole extends React.Component<Props> {
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
      <div
        ref={this.handleDivCreation}
        className={'virtual-display-scrollbar'}
        style={navConsoleStyle}
      >
        <div style={noiseBackgroundStyle}>
          <div className="crt-interference" style={noiseBackgroundImage}/>
        </div>

        <div className="crt-open" style={noiseForegroundStyle}/>

        <NavTabs
          className="crt-open" pluginOptions={this.props.pluginOptions}
        />
      </div>
    );
  }
}

export {
  NavigationConsole,
};
