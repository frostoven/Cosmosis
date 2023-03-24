import * as THREE from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import ChangeTracker from 'change-tracker/src';

// Note: currently not in use by anything; was superseded by what's now called
// Fast2DText.
export default class Slow3DText {
  public onComplete: ChangeTracker;

  private _loader: FontLoader;
  private fontObject: Font;

  constructor(fontName = '') {
    this._loader = new FontLoader();

    this.onComplete = new ChangeTracker();
    this.fontObject = new Font('');

    if (fontName) {
      this.loadFont(fontName);
    }
  }

  loadFont(fontName) {
    this._loader.load(
      // resource URL
      `../../fonts/json/${fontName}.json`,
      // `../../fonts/json/lato-italic-latin-400-v23.json`,

      // onLoad callback
      (font) => {
        // do something with the font
        this.fontObject = font;
        this.onComplete.setValue({ error: null });
      },

      // onError callback
      (error) => {
        console.log('[Fast2DText] Error:', error);
        this.onComplete.setValue({ error: error });
      },
    );
  }

  // Generates text without restrictions, but in a way that's not performant.
  generateText(text, sizeM = 0.1) {
    const shapes = this.fontObject.generateShapes(text, sizeM);
    const geometry = new THREE.ShapeGeometry(shapes);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff8c00,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    geometry.computeBoundingBox();
    // @ts-ignore - boundingBox calculated 1 line ago.
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid, 0, 0);

    return new THREE.Mesh(geometry, material);
  }
}
