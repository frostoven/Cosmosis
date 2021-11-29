import ManagedWorker from './ManagedWorker';
import * as THREE from 'three';
import Unit from '../local/Unit';

export default class OffscreenSkyboxWorker extends ManagedWorker {
  constructor() {
    // Note: offscreenRenderer.js is made available via Webpack bundling.
    super('./build/offscreenSkybox.js');
    this.skyboxCube = null;

    this._collectedImages = [
      null, null, null, null, null, null,
    ];

    this.prepListeners();
  }

  prepListeners() {
    this.addWorkerListener('init', ({ error, value }) => {
      if (error || !value) {
        console.error(error, '- got:', value);
      }
      else {
        this.ready = true;
        this.generateSkybox();
      }
    });

    this.addWorkerListener('renderFace', ({ error, value }) => {
      const { x, y, z, sideNumber, tag } = value;
      if (tag === 'internal cascade') {
        // Caution: this is request**Post**AnimationFrame, not
        // requestAnimationFrame. The difference is that the former runs after
        // each render, whereas the latter runs before each render.
        requestPostAnimationFrame(() => {
            // Technical note: instead of 'toBlob' we could also use toDataUrl;
            // toDataUrl requires less code but blocks the main thread for huge
            // amounts of time (presumably because it does a base64 encode on the
            // binary data) which causes horrendous stutter. Using blobs
            // reduces stuttering to the point where almost unnoticeable.
            this.canvas.toBlob((data) => {
                this._collectedImages[sideNumber] = URL.createObjectURL(data);

                if (sideNumber < 5) {
                  this.renderFace({ x, y, z, sideNumber: sideNumber + 1, tag });
                }
                else {
                  this.applySkyboxFromCache();
                }
              }
            )
          }
        );
      }
    });

    this.addWorkerListener('testHeavyPayload', ({ error, value }) => {
      console.log('testHeavyPayload:', value.length, 'KB transferred.');
    });
  }

  init({ canvas, width, height, pixelRatio, catalogPath }) {
    if (!'transferControlToOffscreen' in canvas) {
      console.error('offscreenControl required for skybox to render.');
      return $modal.alert('Error: offscreen canvas not available; stars will not render.');
    }

    this.canvas = canvas;
    const offscreenControl = canvas.transferControlToOffscreen();
    this.postMessage({
      endpoint: 'init',
      drawingSurface: offscreenControl,
      width,
      height,
      pixelRatio,
      catalogPath,
      // debugCorners: true,
    }, [ offscreenControl ]);
  }

  renderFace({ x, y, z, sideNumber, tag }) {
    this.postMessage({
      endpoint: 'renderFace',
      tag,
      x, y, z,
      sideNumber,
    });
  }

  // Causes a cascade that renders each side of the sky and saves all its
  // images.
  generateSkybox({ x, y, z } = { x: 0, y: 0, z: 0 }) {
    console.log('Starting skybox generation process.');
    // TODO: take real position in universe into account.
    this.renderFace({ x, y, z, sideNumber: 0, tag: 'internal cascade' });
  }

  applySkyboxFromCache() {
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);

    // Create a new array each time to prevent flickering while changing
    // materials.
    const materials = [];
    for (let i = 0; i < 6; i++) {
      // The timeout here isn't technically necessary, but significantly
      // reduces frame stutter.
      setTimeout(() => {
        const texture = loader.load(this._collectedImages[i]);

        // It seems the CubeCamera flips the image. Flip it back.
        texture.flipY = false;

        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
        });
        materials.push(mat);
      }, 10 * i);
    }

    const distance = Unit.centiParsec.inMeters;
    const geometry = new THREE.BoxGeometry(distance, distance, distance);
    // const geometry = new THREE.BoxGeometry(10, 10, 10);
    if (!this.skyboxCube) {
      this.skyboxCube = new THREE.Mesh(geometry, materials);
      $game.spaceScene.add(this.skyboxCube);
    }
    else {
      this.skyboxCube.materials = materials;
    }

    console.log('New skybox generated and applied.');
  }

  // Generates 500MB of data in the skybox worker and copies it to the main
  // thread. This is used to test for frame drops. The expected the result is
  // that the copy itself does not affect performance at all. Tests so far
  // confirm this.
  testHeavyPayload() {
    this.postMessage({
      endpoint: 'testHeavyPayload',
      size: 500000, // 500MB
    });
  }
}
