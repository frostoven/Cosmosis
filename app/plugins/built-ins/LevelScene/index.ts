import { Scene, WebGLRenderer } from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';

class LevelScene extends Scene {
  private _renderer: WebGLRenderer;

  constructor() {
    super();
    this._renderer = new WebGLRenderer();
  }
}

const levelScenePlugin = new CosmosisPlugin('levelScene', LevelScene);

export {
  levelScenePlugin,
}
