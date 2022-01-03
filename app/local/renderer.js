import * as THREE from 'three';

function createRenderer({
  initialisation = {},
  options = {},
} = { initialisation: {}, options: {} }) {
  const renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true,
    alpha: true,
    ...initialisation,
    // preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false,
  });

  if (!initialisation.canvas) {
    console.warn('Creating renderer without canvas.');
  }

  renderer.setPixelRatio(options.devicePixelRatio);
  renderer.setSize(options.width, options.height);
  renderer.shadowMap.enabled = !!options.shadowMapEnabled;
  renderer.shadowMap.type = options.shadowMapType;
  renderer.toneMapping = options.toneMapping;

  return renderer;
}

export {
  createRenderer,
}
