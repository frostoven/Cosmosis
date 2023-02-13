import * as THREE from 'three';
import ChangeTracker from 'change-tracker/src';
import Unit from '../local/Unit';
import { logBootInfo } from '../local/windowLoadListener';

// TODO: maybe rename to astrometrics worker? It's become more than just a
//  skybox machine.
export default class OffscreenSkyboxWorker extends Worker {
  constructor() {
    // Note: offscreenRenderer.js is made available via Webpack bundling.
    super('./build/offscreenSkybox.js', { type: 'module' });
    this.skyboxCube = null;
    this.initComplete = false;
    // Just a tad bigger than the Milky Way. Yes, we can do that. In meters.
    this.skyboxSize = Number(Unit.parsec.inMetersBigInt * BigInt(32768));
    // Used to uniquely identify each web worker request.
    this.ticketCount = 0;
    // Callbacks for each ticket is stored here.
    this.ticketCallbacks = {};

    this._collectedImages = [
      null, null, null, null, null, null,
    ];

    this.prepListeners();
  }

  prepListeners() {
    // Create worker listeners.
    this.workerListener = {
      init: new ChangeTracker(),
      renderFace: new ChangeTracker(),
      getVisibleStars: new ChangeTracker(),
      testHeavyPayload: new ChangeTracker(),
    };

    // Hook listeners into onmessage.
    this.onmessage = (message) => {
      const payload = message.data;
      const listener = this.workerListener[payload.key];
      if (!listener) {
        return console.error(
          '[OffscreenSkyboxWorker] Nothing to receive', payload.key
        );
      }
      listener.setValue(payload);
    };

    // Define listener responses.
    this.workerListener.init.getEveryChange(({ error, value }) => {
      if (this.initComplete) {
        return console.error('[OffscreenSkyboxWorker] Init received twice.');
      }
      this.initComplete = true;
      if (error || !value) {
        console.error(error, '- got:', value);
      }
      else {
        this.generateSkybox();
        $game.event.offscreenSkyboxReady.setValue({ when: new Date() });
      }
    });

    this.workerListener.renderFace.getEveryChange(({ value }) => {
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
            );
          }
        );
      }
    });

    this.workerListener.getVisibleStars.getEveryChange(({ value }) => {
      const ticketCallback = this.ticketCallbacks[value.ticket];
      if (ticketCallback) {
        ticketCallback(value);
        delete this.ticketCallbacks[value.ticket];
      }
    });

    this.workerListener.testHeavyPayload.getEveryChange(({ error, value }) => {
      console.log('testHeavyPayload:', value.length, 'KB transferred. Error:', error);
    });
  }

  init({
    canvas, width, height, skyboxAntialias, pixelRatio, catalogPath,
    disableSkybox, debugSides, debugCorners,
  }) {
    disableSkybox ?
      logBootInfo('[!] Skybox disabled') : // Blasphemous acts.
      logBootInfo('Scanning skies');

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
      skyboxAntialias,
      pixelRatio,
      catalogPath,
      disableSkybox,
      debugSides,
      debugCorners,
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

  // Gets the astrometrics worker to determine which stars are visible at the
  // specified coordinates.
  getVisibleStars({ x, y, z , distanceLimit=Infinity, callback }) {
    const ticket = ++this.ticketCount;
    this.ticketCallbacks[ticket] = callback;
    this.postMessage({
      endpoint: 'getVisibleStars', ticket,
      x, y, z , distanceLimit,
    });
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
        texture.encoding = THREE.sRGBEncoding;

        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
        });
        materials.push(mat);
      }, 10 * i);
    }

    const distance = this.skyboxSize;
    const geometry = new THREE.BoxGeometry(distance, distance, distance);
    $game.playerShip.getOnce(({ centerPoint }) => {
      if (!this.skyboxCube) {
        this.skyboxCube = new THREE.Mesh(geometry, materials);
        centerPoint.add(this.skyboxCube);
      }
      else {
        this.skyboxCube.materials = materials;
      }

      console.log('New skybox generated and applied.');
      $game.event.skyboxLoaded.setValue({ when: new Date() });
    });
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
