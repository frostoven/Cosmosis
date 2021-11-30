import * as THREE from 'three';

function createRenderer({
  initialisation = {},
  options = {},
} = { initialisation: {}, options: {} }) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
    alpha: true,
    ...initialisation,
    // preserveDrawingBuffer: true,
  });

  if (!initialisation.canvas) {
    console.warn('Creating renderer without canvas.');
  }

  renderer.setPixelRatio(options.devicePixelRatio);
  renderer.setSize(options.width, options.height);

  renderer.shadowMap.enabled = !!options.shadowMapEnabled;
  renderer.shadowMap.type = options.shadowMapType;

  // TODO: give options for shaders 'colourful' vs 'filmic'.
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // renderer.toneMapping = THREE.NoToneMapping;

  // TODO: add to graphics menu.
  // renderer.gammaOutput = true;
  // renderer.gammaFactor = 2.2;

  return renderer;
}

export {
  createRenderer,
}
