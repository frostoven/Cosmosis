import { Scene, WebGLRenderer } from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';

class SpaceScene extends Scene {
  private _renderer: WebGLRenderer;

  constructor() {
    super();
    this._renderer = new WebGLRenderer();
  }
}

const spaceScenePlugin = new CosmosisPlugin('spaceScene', SpaceScene);

export {
  spaceScenePlugin,
}
