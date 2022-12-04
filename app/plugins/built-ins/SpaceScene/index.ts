// noinspection DuplicatedCode
import {
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Vector3,
} from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameState } from '../../gameState';
import { CoreType } from '../Core';
import userProfile from '../../../userProfile';

class SpaceScene extends Scene {
  private _renderer: WebGLRenderer;
  private _cachedCamera: PerspectiveCamera;

  constructor() {
    super();
    this._cachedCamera = new PerspectiveCamera();

    const { debug, display, graphics } = userProfile.getCurrentConfig({
      identifier: 'userOptions'
    });

    const farObjectCanvas = document.getElementById('far-object-canvas');
    const renderer = new WebGLRenderer({
      logarithmicDepthBuffer: true,
      alpha: true,
      // @ts-ignore
      canvas: farObjectCanvas,
      powerPreference: "high-performance",
      antialias: false,
      stencil: false,
      depth: false,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !!graphics.enableShadows;
    renderer.shadowMap.type = graphics.shadowType;
    renderer.toneMapping = display.toneMapping;

    this._renderer = renderer;

    gameState.tracked.core.getOnce((core: CoreType) => {
      core.appendRenderHook(this.render.bind(this));
    });

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    const cube = new Mesh(geometry, material);
    this.add(cube);
    cube.position.copy(new Vector3(1.5, 0.25, -6));

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.onWindowResize();
  }

  _setupWatchers() {
    gameState.tracked.player.getEveryChange((camera) => {
      this._cachedCamera = camera;
    });
  }

  onWindowResize() {
    const { graphics } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    const scale = graphics.resolutionScale;
    this._renderer.setSize(screenWidth * scale, screenHeight * scale);
    this._renderer.domElement.style.width = '100%';
    this._renderer.domElement.style.height = '100%';
    this._cachedCamera.aspect = screenWidth / screenHeight;
    this._cachedCamera.updateProjectionMatrix();
  }

  render() {
    this._renderer.render(this, this._cachedCamera);
  }
}

const spaceScenePlugin = new CosmosisPlugin('spaceScene', SpaceScene);

export {
  spaceScenePlugin,
}
