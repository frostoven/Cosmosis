import { MeshBasicMaterial, Scene } from 'three';
import { HudAlign } from './HudAlign';
import MeshLoader from '../../../NodeOps/types/MeshLoader';
import { gameRuntime } from '../../../../gameRuntime';

export default class HudItem {
  static defaultOptions = {
    model: 'ndcTester',
    align: HudAlign.center,
    scale: 1,
  };

  public align: OmitThisParameter<() => void>;

  public scene: Scene | null;
  private _parent: Scene;
  private _modelFileName: string;
  private scale: number;

  constructor(options) {
    this.align = () => {};
    this.setAlignment(HudAlign.center);
    this.scale = 1;

    this.scene = null;
    this._parent = new Scene();
    this._modelFileName = '';

    this.changeOptions(options);
  }

  changeOptions(options) {
    options = { ...HudItem.defaultOptions, ...options };
    options.model && (this._modelFileName = options.model);
    options.align && (this.setAlignment(options.align));
    options.scale && (this.scale = options.scale);
  }

  init(parent) {
    this._parent = parent;

    let aspect = window.innerWidth / window.innerHeight;
    aspect > 1 ? aspect = 1 / aspect : null;
    console.log('--> res:', window.innerWidth, window.innerHeight, ':', aspect);

    const options = { ...MeshLoader.defaultNodeOpts };
    options.materialOverrideCallback = (node) => {
      node.material = new MeshBasicMaterial();
    };

    if (this.scene) {
      // Skip model loading if it's already been loaded before.
      return;
    }

    // const loader = new MeshLoader('getHudModel', 'ndcTester', options);
    const loader = new MeshLoader('getHudModel', this._modelFileName, options);
    loader.trackedMesh.getOnce(({ gltf }) => {
      this.scene = gltf.scene;
      console.log('---> hud gltf mesh:', gltf.scene.scale);

      gameRuntime.tracked.player.getOnce(({ camera }) => {
        camera.add(gltf.scene);
        gltf.scene.translateZ(-0.05);

        this.align();

        window.addEventListener('resize', this.align);
      });
    });
  }

  fitRight() {
    if (!this.scene) {
      return;
    }

    const offset = 0.005;
    let trueAspect = window.innerWidth / window.innerHeight;
    let relAspect = trueAspect > 1 ? 1 / trueAspect : trueAspect;

    // Always choose the ratio that's between 0 and 1. We use this to
    // dynamically resize HUD elements according to window size.
    const size = relAspect * 0.025 * this.scale;
    this.scene.scale.set(size, size, size);
    this.scene.position.x = (window.innerWidth * trueAspect * 0.00001) + offset;
    // console.log(window.innerWidth, size);
    console.log(this.scene.position.x);

    // // This stays on the same physical position on the screen. Not what we
    // // want, but useful from an educational perspective.
    // this.scene.position.x = size;
  }

  fitBottomRight() {
    if (!this.scene) {
      return;
    }

    const offset = 0.005;
    let trueAspect = window.innerWidth / window.innerHeight;
    let relAspect = trueAspect > 1 ? 1 / trueAspect : trueAspect;

    // Always choose the ratio that's between 0 and 1. We use this to
    // dynamically resize HUD elements according to window size.
    const size = relAspect * 0.025;
    this.scene.scale.set(size, size, size);
    this.scene.position.x = (window.innerWidth * trueAspect * 0.00001) + offset;
    this.scene.position.y = (-window.innerHeight * trueAspect * 0.00001);
    console.log(this.scene.position.x);
  }

  fitTopRight() {
    if (!this.scene) {
      return;
    }

    const offset = 0.005;
    let trueAspect = window.innerWidth / window.innerHeight;
    let relAspect = trueAspect > 1 ? 1 / trueAspect : trueAspect;

    // Always choose the ratio that's between 0 and 1. We use this to
    // dynamically resize HUD elements according to window size.
    const size = relAspect * 0.025;
    this.scene.scale.set(size, size, size);
    this.scene.position.x = (window.innerWidth * trueAspect * 0.00001) + offset;
    this.scene.position.y = (window.innerHeight * trueAspect * 0.00001);
  }

  fitCenter() {
    if (!this.scene) {
      return;
    }

    let aspect = window.innerWidth / window.innerHeight;
    // Always choose the ratio that's between 0 and 1. We use this to
    // dynamically resize HUD elements according to window size.
    const size = (aspect > 1 ? 1 / aspect : aspect) * 0.025;
    this.scene.scale.set(size, size, size);
  }

  setAlignment(alignment: HudAlign) {
    switch (alignment) {
      // case hudAlign.left:
      //   this.align = this.fitLeft.bind(this);
      //   break;
      case HudAlign.right:
        this.align = this.fitRight.bind(this);
        break;
      case HudAlign.bottomRight:
        this.align = this.fitBottomRight.bind(this);
        break;
      case HudAlign.topRight:
        this.align = this.fitTopRight.bind(this);
        break;
      case HudAlign.center:
        this.align = this.fitCenter.bind(this);
        return;
      default:
        console.error('[HudItem] Invalid option', alignment);
        return;
    }
  }
}
