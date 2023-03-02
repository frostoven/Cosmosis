import * as THREE from 'three';
import ChangeTracker from 'change-tracker/src';
import MultiPageShader from '../../hackedlibs/three-bmfont-text/shaders/multipage';

import createBmGeometry from '../../hackedlibs/three-bmfont-text';
import loadBmFont from 'load-bmfont';

const textureLoader = new THREE.TextureLoader();

type FontMaterial = THREE.MeshBasicMaterial | THREE.RawShaderMaterial;

interface Fast2DTextOptions {
  opacity?: number,
  backfaceCulling?: boolean,
}

interface FontInfo {
  name: string,
  fnt: string,
  atlas: string | Array<string>,
  scale: number,
}

interface FontTemplates {
  [fontName: string] : FontInfo,
}

// TODO: multiply all the below scales with 0.25
const availableFonts: FontTemplates = {
  arial: {
    name: 'Arial',
    fnt: 'fonts/bmfont/arial.fnt',
    atlas: 'fonts/bmfont/arial_0.png',
    scale: 0.000375,
  },
  latoRegular: {
    name: 'Lato',
    fnt: 'hackedlibs/three-bmfont-text/test/fnt/Lato-Regular-64.fnt',
    atlas: 'hackedlibs/three-bmfont-text/test/fnt/lato.png',
    scale: 0.00046375,
  },
  norwester: {
    name: 'Norwester',
    fnt: 'hackedlibs/three-bmfont-text/test/fnt/Norwester-Multi-64.fnt',
    atlas: [
      'hackedlibs/three-bmfont-text/test/fnt/Norwester-Multi_0.png',
      'hackedlibs/three-bmfont-text/test/fnt/Norwester-Multi_1.png',
      'hackedlibs/three-bmfont-text/test/fnt/Norwester-Multi_2.png',
      'hackedlibs/three-bmfont-text/test/fnt/Norwester-Multi_3.png',
    ],
    scale: 0.0004,
  },
  // TODO: add SDF (signed distance field) and MSDF support.
  // dejaVuSdf: {
  //   fnt: 'hackedlibs/three-bmfont-text/test/fnt/DejaVu-sdf.fnt',
  //   atlas: 'hackedlibs/three-bmfont-text/test/fnt/DejaVu-sdf.png',
  //   scale: 0.00415,
  // },
};

export default class Fast2DText {
  public onComplete: ChangeTracker;
  private _font: any;
  private readonly _fontInfo!: FontInfo;
  private _bmTextGeo: any;
  private _bmTextMat: any;
  public mesh: THREE.Mesh | null;
  private readonly _initialOpacity!: number;
  private readonly _initialSide!: number;
  private readonly _baseScale!: number;
  private _currentScale!: number;
  private readonly _singlePaged!: boolean;
  // Used to make this act a bit more like a scene. It's a dirty work-around
  // and probably needs to be reworked.
  private readonly _scale_compat!: { setScalar: (newScale) => void };

  constructor(fontName, options: Fast2DTextOptions = {}) {
    this.onComplete = new ChangeTracker();

    this._font = null;
    this._bmTextGeo = null;
    this.mesh = null;

    this._scale_compat = {
      setScalar: newScale => this.setScale(newScale),
    };

    if (!fontName) {
      console.error(
        'Fast2DText needs a font name. Available fonts:',
        Object.keys(availableFonts).join(', '),
      );
      return;
    }

    this._fontInfo = availableFonts[fontName];
    if (!this._fontInfo) {
      console.error(
        `Font ${fontName} is not available. Available fonts:`,
        Object.keys(availableFonts).join(', '),
      );
      return;
    }

    this._initialOpacity = options.opacity || 0.6;
    this._initialSide = options.backfaceCulling === false
        ? THREE.DoubleSide
        : THREE.FrontSide;

    this._baseScale = this._fontInfo.scale;
    this._currentScale = this._baseScale;
    this._singlePaged = !Array.isArray(this._fontInfo.atlas);

    this._loadFont(fontName);
  }

  setScale(newScale: number) {
    if (this._currentScale === newScale) {
      return;
    }
    const scale = newScale * this._baseScale;
    this.mesh!.scale.set(scale, scale, scale);
    this._currentScale = newScale;
  }

  setText(text) {
    this._bmTextGeo.update(text);
  }

  get scale() {
    return this._scale_compat;
  }

  get position() {
    return this.mesh!.position;
  }

  get rotation() {
    return this.mesh!.rotation;
  }

  get opacity() {
    if (this._singlePaged) {
      return this._bmTextMat.opacity;
    }
    else {
      return this._bmTextMat.uniforms.opacity.value;
    }
  }

  set opacity(value) {
    if (this._singlePaged) {
      this._bmTextMat.opacity = value;
    }
    else {
      this._bmTextMat.uniforms.opacity.value = value;
    }
  }
  
  _loadFont(fontName) {
    const fontInfo = this._fontInfo;

    loadBmFont(fontInfo.fnt, (error, font) => {
      // loadBmFont('hackedlibs/three-bmfont-text/test/fnt/Lato-Regular-64.fnt', (error, font) => {
      if (error) {
        console.error(error);
        return;
      }
      this._font = font;

      if (Array.isArray(fontInfo.atlas)) {
        const promiseArray: Array<Promise<any>> = [];
        for (let i = 0, len = fontInfo.atlas.length; i < len; i++) {
          promiseArray.push(textureLoader.loadAsync(fontInfo.atlas[i]));
        }
        Promise.all(promiseArray).then(this._createMultiPage.bind(this));
      }
      else {
        textureLoader.load(
          fontInfo.atlas,
          this._createSinglePage.bind(this),
          undefined,
          error => console.error(error),
        );
      }
    });
  }

  _createMultiPage(textures) {
    const geometry = createBmGeometry({
      font: this._font,
      multipage: true,
    });

    const material = new THREE.RawShaderMaterial(
      MultiPageShader({
        textures,
        color: 0xff8c00,
        transparent: this._initialOpacity !== 1,
        opacity: this._initialOpacity,
        side: this._initialSide,
      }),
    );

    this._createMesh(geometry, material);
  }

  _createSinglePage(texture) {
    const fontInfo = this._fontInfo;
    const geometry = createBmGeometry({ font: this._font });

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xff8c00,
      transparent: this._initialOpacity !== 1,
      opacity: this._initialOpacity,
      side: this._initialSide,
    });

    this._createMesh(geometry, material);
  }

  _createMesh(geometry: THREE.BufferGeometry, material: FontMaterial) {
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh = mesh;
    this._bmTextGeo = geometry;
    this._bmTextMat = material;
    this.setScale(1);
    this.onComplete.setValue(1);
    // this._debugFont();
  }

  // _debugFont() {
  //   this._bmTextGeo.update('3291.84 km/h');
  //   let count = 0;
  //   this.mesh.translateY(1);
  //   this.mesh.translateZ(-0.5);
  //   $gameRuntime._tracked.levelScene._cached.add(this.mesh);
  //   const anim = () => {
  //     requestAnimationFrame(anim);
  //     this._bmTextGeo.update('Count:' + ++count);
  //   };
  //   anim();
  // }
}

export {
  Fast2DTextOptions,
  FontInfo,
  FontTemplates,
}
