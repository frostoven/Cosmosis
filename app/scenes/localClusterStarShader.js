import fs from 'fs';
import * as THREE from 'three';
import core from '../local/core';
import { logBootInfo } from '../local/windowLoadListener';
import { getStartupEmitter, startupEvent } from '../emitters';
import { getShader } from '../../shaders';
import AssetFinder from '../local/AssetFinder';

const startupEmitter = getStartupEmitter();

const spectralCombinations = {};

// function register() {
//   core.registerScene({
//     name: 'localCluster',
//     init,
//   });
// }

function createScene({ scene, catalog }) {
  const validStars = [];

  for (let i = 0; i < catalog.length; i++) {
    if (i !== 0 && i % 50000 === 0 || i === catalog.length - 1) {
      logBootInfo(`Loading star ${i}`, true);
    }
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

  populateSky({ validStars });
}

function loadAndCreate({ scene, catalogPath }) {
  fs.readFile(catalogPath, (error, data) => {
    if (error) {
      console.error('Fata error loading star catalog:', error);
    }
    else {
      createScene({ scene, catalog: JSON.parse(data) });
    }
  });
}

function init({ font }) {
  const scene = new THREE.Scene();

  // Look for the prod catalog first. If not found, default to the much smaller
  // built-in.
  AssetFinder.getStarCatalog({
    name: 'bsc5p_3d_min',
    options: {
      silenceErrors: true,
    },
    callback: (error, fileName, parentDir) => {
      if (error) {
        AssetFinder.getStarCatalog({
          name: 'constellation_test',
          callback: (error, fileName, parentDir) => {
            // console.log('-----> got', parentDir, fileName);
            loadAndCreate({ scene, catalogPath: `./${parentDir}/${fileName}` });
          }
        });
      }
      else {
        // console.log('-----> got', fileName);
        loadAndCreate({ scene, catalogPath: `./${parentDir}/${fileName}` });
      }
    }
  });

  return scene;
}

// TODO: continue here: this should be loaded after catalog has been loaded.
function populateSky({ validStars }) {
  startupEmitter.on(startupEvent.ready, () => {
    const scene = $game.spaceScene;

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

    const { vertexShader, fragmentShader } = getShader('starfield-blackbody');
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        alphaTest: { value: 0.9 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      // depthTest: false,
      extensions: {
        drawBuffers: true,
      },
    });
    window.material = material;

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
  });
}

export default {
  name: 'localCluster',
  register,
}
