import _ from 'lodash';
import { Color, Mesh, MeshBasicMaterial, Scene } from 'three';
import { HudAlign } from './HudAlign';
import MeshLoader from '../../../NodeOps/types/MeshLoader';
import { gameRuntime } from '../../../../gameRuntime';
import ChangeTracker from 'change-tracker/src';
import AnimationSlider from '../../../../../local/AnimationSlider';
import { clamp } from '../../../../../local/mathUtils';
import Fast2DText from '../../../../../local/Fast2DText';

type SceneOrText = Scene | Fast2DText;
type MeshWithBasicMat = Mesh & { material: MeshBasicMaterial };

const DISTANCE_TO_FACE = -0.05;

const themeExamples = {
  industrial: {
    primary: 0xc6dde3,
    active: 0xff8c00,
    reverse: 0xff0000,
    inactive: 0x080808,
    lowlights: 0x000000,
  },
  blueOnPurple: {
    primary: 0xff0000,
    active: 0x00adff,
    reverse: 0xff0000,
    inactive: 0x080808,
    lowlights: 0xf600ff,
  },
  redOnPurple: {
    primary: 0x00adff,
    active: 0xff0000,
    reverse: 0xff0000,
    inactive: 0x080808,
    lowlights: 0xf600ff,
  }
};

export default class HudItem {
  static defaultOptions = {
    model: 'ndcTester',
    text: null,
    align: HudAlign.center,
    scale: 1,
    flipOnNegativeProgress: false,
  };

  public align: OmitThisParameter<() => void>;

  public scene: SceneOrText | null;
  public mesh: MeshWithBasicMat | null;
  public onMeshLoaded: ChangeTracker;
  public _animationSlider: AnimationSlider;
  public _progressBlips: Array<MeshWithBasicMat>;

  private _parent: Scene;
  // The name (without extension) of the model to load from the hudModel
  // directory. Note that this option and _text are mutually exclusive.
  private _modelFileName: string;
  // The text you want displayed. Note that this option and _modeFileName are
  // mutually exclusive.
  private _text: string;
  private scale: number;
  private flipOnNegativeProgress: boolean;
  private colors: {
    primary: number, active: number, reverse: number,
    inactive: number, lowlights: number
  };

  constructor(options) {
    this.align = () => {};
    this.setAlignment(HudAlign.center);
    this.scale = 1;

    this.scene = null;
    this.mesh = null;
    this._parent = new Scene();
    this._modelFileName = '';
    this._text = '';
    // @ts-ignore
    this._animationSlider = null;
    this._progressBlips = [];
    this.onMeshLoaded = new ChangeTracker();
    this.flipOnNegativeProgress = false;
    this.colors = { ...themeExamples.industrial };

    this.changeOptions(options);
  }

  changeOptions(options) {
    options = { ...HudItem.defaultOptions, ...options };
    options.model && (this._modelFileName = options.model);
    options.text && (this._text = options.text);
    options.align && (this.setAlignment(options.align));
    options.scale && (this.scale = options.scale);
    options.flipOnNegativeProgress && (this.flipOnNegativeProgress = options.flipOnNegativeProgress);
    options.colors && (this.colors = options.colors);
  }

  init(parent) {
    this._parent = parent;

    const options = { ...MeshLoader.defaultNodeOpts };
    options.materialOverrideCallback = (node) => {
      node.material = new MeshBasicMaterial();
    };

    if (this.scene) {
      // Skip model loading if it's already been loaded before.
      return;
    }

    if (this._text) {
      this._loadFont(options);
    }
    else {
      this._loadMesh(options);
    }
  }

  _loadFont(options) {
    // Note: Fast2DText is not actually Scene-compatible - it has some
    // functions that were specifically written to overlap for use in HurdItem.
    const text2d = new Fast2DText('norwester');
    text2d.onComplete.getOnce(() => {

      gameRuntime.tracked.player.getOnce(({ camera }) => {
        camera.add(text2d.mesh);

        text2d.mesh!.rotateY(Math.PI);
        text2d.mesh!.rotateZ(Math.PI);
        text2d.mesh!.translateZ(-DISTANCE_TO_FACE);
        this.scale *= 5.0;
        text2d.setText(this._text);
        this.scene = text2d;
        // @ts-ignore
        this.mesh = text2d.mesh;

        this.align();
        window.addEventListener('resize', () => {
          this.align();
        });
        this.onMeshLoaded.setValue(true);
      });
    });
  }

  _loadMesh(options) {
    // const loader = new MeshLoader('ndcTester', 'getHudModel', options);
    const loader = new MeshLoader(this._modelFileName, 'getHudModel', options);
    loader.trackedMesh.getOnce(({ gltf }) => {
      this.mesh = gltf;
      this.scene = gltf.scene;
      gameRuntime.tracked.player.getOnce(({ camera }) => {
        camera.add(gltf.scene);
        // Place hud item 0.05cm away from the player's face (or projector
        // screen, if that's the target).
        gltf.scene.translateZ(DISTANCE_TO_FACE);
        this.align();
        this._setupAnimation();
        window.addEventListener('resize', this.align);
        this.onMeshLoaded.setValue(true);
      });
    });
  }

  _setupAnimation() {
    // Check for appropriate mesh code. Normally, we would let the mesh code
    // handler deal with this, but given that this is a HUD component and not
    // a ship part, I'm not sure how to properly deal with this. Placing here
    // for now, can refactor later if this is a mistake.
    let foundAnimation = false;
    let blipSteps: Array<MeshWithBasicMat> = [];

    // @ts-ignore - our usage is correct.
    this.scene?.traverse((node: MeshWithBasicMat) => {
      if (node.isMesh) {
        const userData = node.userData;
        if (userData.csmType === 'hudProgressAnimation') {
          node.material.color.set(this.colors.primary);
          foundAnimation = true;
        }
        else if (userData.csmType === 'hudProgressBlip') {
          node.material.color.set(this.colors.inactive);
          blipSteps.push(node);
        }
        else {
          node.material.color.set(this.colors.active);
        }
      }
    });

    if (blipSteps.length) {
      this._progressBlips = _.sortBy(
        blipSteps, (item) => item.userData.csmStepPosition,
      );
    }

    this._animationSlider = new AnimationSlider(this.mesh);
  }

  setProgress(playerThrottle, actualThrottle, disableBlip = false) {
    const sliderPerc = Math.abs(playerThrottle);
    const blipPerc = Math.abs(actualThrottle);

    if (this.flipOnNegativeProgress) {
      if (playerThrottle < 0) {
        // @ts-ignore
        this.scene.rotation.x = Math.PI;
      }
      else {
        // @ts-ignore
        this.scene.rotation.x = 0;
      }
    }
    this._animationSlider.seek(sliderPerc);

    if (disableBlip) {
      return;
    }

    if (this._progressBlips.length) {
      let lowColor = new Color(this.colors.inactive);
      let highColor = new Color(this.colors.active);

      const step = blipPerc * 10;
      const blips = this._progressBlips;
      for (let i = 0, len = blips.length; i < len; i++) {
        const node = this._progressBlips[i];
        const color = new Color();

        let progress = clamp(step - i, 0, 1);

        if (progress === 0) {
          progress = Math.abs(clamp(((step - i) / 10), -1, 0));
          highColor = new Color(this.colors.lowlights);
        }
        else if (actualThrottle !== blipPerc) {
          highColor = new Color(this.colors.reverse);
        }

        color.lerpColors(lowColor, highColor, progress);
        node.material.color.set(color);
      }
    }
  }

  setText(text) {
    // @ts-ignore
    this.scene.setText(text);
  }

  fitRight() {
    if (!this.scene) {
      return;
    }

    let offset = 0.005;
    let trueAspect = window.innerWidth / window.innerHeight;
    let relAspect = trueAspect > 1 ? 1 / trueAspect : trueAspect;

    // Always choose the ratio that's between 0 and 1. We use this to
    // dynamically resize HUD elements according to window size.
    const size = relAspect * 0.025 * this.scale;
    this.scene.scale.setScalar(size);

    if (this._text) {
      // Align the text so it stays in the screen.
      const geo = this.mesh!.geometry;
      geo.computeBoundingBox();
      const realX = geo.boundingBox!.max.x * this.mesh!.scale.x;
      offset -= realX;
    }

    this.scene.position.x = (window.innerWidth * trueAspect * 0.00001) + offset;

    // // This stays on the same physical position on the screen. Not what we
    // // want, but useful from an educational perspective.
    // this.scene.position.x = size;
  }

  fitBottomRight() {
    if (!this.scene) {
      return;
    }

    let offset = 0.005;
    let trueAspect = window.innerWidth / window.innerHeight;
    let relAspect = trueAspect > 1 ? 1 / trueAspect : trueAspect;

    // Always choose the ratio that's between 0 and 1. We use this to
    // dynamically resize HUD elements according to window size.
    const size = relAspect * 0.025 * this.scale;
    this.scene.scale.setScalar(size);

    if (this._text) {
      // Align the text so it stays in the screen.
      const geo = this.mesh!.geometry;
      geo.computeBoundingBox();
      const realX = geo.boundingBox!.max.x * this.mesh!.scale.x;
      offset = realX;
    }

    this.scene.position.x = (window.innerWidth * trueAspect * 0.00001) + offset;
    this.scene.position.y = -0.025;
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
    const size = relAspect * 0.025 * this.scale;
    this.scene.scale.setScalar(size);
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
    const size = (aspect > 1 ? 1 / aspect : aspect) * 0.025 * this.scale;
    this.scene.scale.setScalar(size);
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

  // Don't use for real code, it hardcodes some stuff for testing. It will also
  // name to the level center if the window is resized (because it auto-aligns
  // with the parent after aspect changes).
  _debugDetachFromFace() {
    gameRuntime.tracked.levelScene.getOnce((levelScene) => {
      console.log('-> HudItem detaching:', this.scene);
      try {
        // @ts-ignore
        levelScene.attach(this.scene.mesh);
      }
      catch (error) {
        levelScene.attach(this.scene);
      }
    });
  }
}
