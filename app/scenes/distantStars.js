// Used to draw stars that are outside usual rendering range. This scene is
// mostly used to generate skyboxes, but can also be used for catalog testing.

import * as THREE from 'three';

const spectralCombinations = {};

function createScene({ scene, catalog, shaderLoader, onLoaded=()=>{} }) {
  const validStars = [];

  for (let i = 0; i < catalog.length; i++) {
    // if (i !== 0 && i % 50000 === 0 || i === catalog.length - 1) {
    //   console.log(`Loading star ${i}`, true);
    // }
    const star = catalog[i];
    const diameter = 0.015;
    const scale = 1;

    const starIndex = star.i;
    const name = star.n;

    let parsecs = star.p;
    const brightness = star.b;
    const spectralType = star.s;
    if (!spectralCombinations[spectralType]) {
      spectralCombinations[spectralType] = 1;
    }
    else {
      spectralCombinations[spectralType]++;
    }

    if (!parsecs) {
      console.error(`Skipping [${star.i}] ${name} because it has no distance (${parsecs}).`);
      continue;
    }

    validStars.push(star);
  }

  populateSky({ scene, validStars, shaderLoader, onLoaded });
}

/**
 * Initialises the star field.
 * @param {JSON} catalogJson - JSON object containing all stars
 * @param {function} shaderLoader - Function used to load shader files. The
 *   reason this cannot be handled automatically is because web workers and
 *   main thread workers currently use incompatible file loading mechanisms.
 * @param {function} onLoaded - Called when everything is done loading.
 * @returns {Scene}
 */
function init({ catalogJson, shaderLoader, onLoaded=()=>{} }) {
  const scene = new THREE.Scene();
  createScene({ scene, catalog: catalogJson, shaderLoader, onLoaded });
  return scene;
}

// TODO: continue here: this should be loaded after catalog has been loaded.
function populateSky({ scene, validStars, shaderLoader, onLoaded=()=>{} }) {
  // TODO: Add ways to check for LMC, SMC, Andromeda, clusters, etc.

  const glowColor = new THREE.Color();
  const color = [];
  const glow = [];
  const luminosity = [];
  const distance = [];
  const vertices = [];
  const parsec = 30856775814913673;
  const sunSize = 1392700000;

  let prevLoc = {};
  for (let i = 0; i < validStars.length; i++) {
    const star = validStars[i];

    // vertices.push(star.x * parsec, star.y * parsec, star.z * parsec);
    vertices.push(star.x, star.y, star.z);

    // bookm
    if (!star.K) {
      console.warn(star.n, 'has invalid colour; setting generic placeholder. Dump:', star);
      // 6400 K colour, medium white.
      star.K = { r: 1, g: 0.9357, b: 0.9396 };
    }

    glow.push(star.K.r);
    glow.push(star.K.g);
    glow.push(star.K.b);

    luminosity[i] = star.N;
    distance[i] = star.p;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
  geometry.setAttribute('glow', new THREE.Float32BufferAttribute(glow, 3));
  geometry.setAttribute('luminosity', new THREE.Float32BufferAttribute(luminosity, 1));
  geometry.setAttribute('distance', new THREE.Float32BufferAttribute(distance, 1));

  // TODO: reimplement me.
  // const { vertexShader, fragmentShader } = getShader('starfield-blackbody');
  shaderLoader('starfield-blackbody', (error, { vertexShader, fragmentShader }) => {
    if (error) {
      return console.error(
        'Failed to load starfield-blackbody shader; error:', error
      );
    }

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        alphaTest: { value: 0.9 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      extensions: {
        drawBuffers: true,
      },
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    onLoaded();
  });
}

export default {
  init,
}
