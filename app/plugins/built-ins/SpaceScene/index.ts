import {
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import { CoreType } from '../Core';
import userProfile from '../../../userProfile';
import * as THREE from 'three';
import { cubeToSphere } from '../../../local/mathUtils';
export default class SpaceScene extends Scene {
  public skybox: Mesh<BoxGeometry, MeshBasicMaterial[]> | null = null;
  private _renderer: WebGLRenderer;
  private _cachedCamera: PerspectiveCamera;

  constructor() {
    super();
    this._cachedCamera = new PerspectiveCamera();
    this._setupWatchers();

    const { display, graphics } = userProfile.getCurrentConfig({
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

    renderer.useLegacyLights = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !!graphics.enableShadows;
    renderer.shadowMap.type = graphics.shadowType;
    renderer.toneMapping = display.toneMapping;

    // renderer.outputEncoding = sRGBEncoding;

    this._renderer = renderer;

    gameRuntime.tracked.core.getOnce((core: CoreType) => {
      core.prependRendererHook(this.render.bind(this));
    });

    // --------------------------------------------------------------------- //
    // const geometry = new BoxGeometry(1, 1, 1);
    // const material = new MeshBasicMaterial({ color: 0xff0000 });
    // const cube = new Mesh(geometry, material);
    // this.add(cube);
    // cube.position.copy(new Vector3(1.5, 0.25, -6));
    // --------------------------------------------------------------------- //

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.onWindowResize();
  }

  _setupWatchers() {
    gameRuntime.tracked.player.getEveryChange((player) => {
      this._cachedCamera = player.camera;
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
    // TODO: move this to player module.
    this._cachedCamera.aspect = screenWidth / screenHeight;
    this._cachedCamera.updateProjectionMatrix();
  }

  setSkyboxSides(newTextures: THREE.CanvasTexture[]) {
    console.log('--> building skybox on main thread');
    let i: number, len: number;

    const newMaterials: THREE.MeshBasicMaterial[] = [];
    for (i = 0, len = newTextures.length; i < len; i++) {
      // @ts-ignore
      const bitmap: THREE.CanvasTexture = newTextures[i];
      bitmap.colorSpace = 'srgb';
      // bitmap.image.
      const newMaterial = new THREE.MeshBasicMaterial({
        map: bitmap,
        side: THREE.BackSide,
      });
      newMaterials.push(newMaterial);
    }

    if (!this.skybox) {
      // The idea with size is to get as close to infinity as possible while
      // still keeping some distance from glitches. This can go up to 1e38
      // before things start breaking down.
      // Note that 1e15 is ~ Number.MAX_SAFE_INTEGER.
      const size = 1e32;
      const radius = size * 0.5;
      let geometry = new THREE.BoxGeometry(size, size, size, 64, 64, 64);
      cubeToSphere(geometry, radius);

      this.skybox = new THREE.Mesh(geometry, newMaterials);
      this.add(this.skybox);
      console.log('[SpaceScene] skybox:', this.skybox);
    }
    else {

      // A Three material can be an array of materials. In this case, it's an
      // array, so 'materials' is not a typo.
      const oldMaterials = this.skybox.material;
      for (i = 0, len = oldMaterials.length; i < len; i++) {
        const material: THREE.MeshBasicMaterial = oldMaterials[i];
        // This saddens me a bit, but I have not yet found a modern way of
        // updating texture maps without disposing the old maps. Methods used
        // with older Three.js don't appear to work.
        material.dispose();

        // Assign new skybox side material.
        oldMaterials[i] = newMaterials[i];
      }
    }
  }

  render() {
    this._renderer.render(this, this._cachedCamera);
  }
}

const spaceScenePlugin = new CosmosisPlugin('spaceScene', SpaceScene);

export {
  spaceScenePlugin,
}
