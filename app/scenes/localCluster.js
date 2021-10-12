// Generate a number of text labels, from 1µm in size up to 100,000,000 light years
// Try to use some descriptive real-world examples of objects at each scale

import * as THREE from 'three';

import core from '../local/core';
import { logBootInfo } from '../local/windowLoadListener';
import { getStartupEmitter, startupEvent } from '../emitters';
import { getShader } from '../../shaders';
const STARS_JSON = require('../../prodHqAssets/starCatalogs/bsc5p_radec_min.json');

const startupEmitter = getStartupEmitter();

const spectralCombinations = {};

function register() {
  core.registerScene({
    name: 'localCluster',
    init,
  });
}

const allStarMeshes = [];

const validStars = [];

function init({ font }) {
  const scene = new THREE.Scene();

  for (let i = 0; i < STARS_JSON.length; i++) {
    if (i !== 0 && i % 50000 === 0 || i === STARS_JSON.length - 1) {
      logBootInfo(`Loading star ${i}`, true);
    }
    const star = STARS_JSON[i];
    const diameter = 0.015;
    const scale = 1;
    let image = 'potatoLqAssets/planetImg/blank.png';

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

    // TODO: look at HD33948 surrounding nebula.
    // http://my.sky-map.org/?img_source=IMG_904259:all&ra=5.225917&de=-8.14778&zoom=6&show_box=1&box_ra=5.225917&box_de=-8.14778&box_width=50&box_height=50
    // TODO: also have a look at CL Scorpii, a zombie type star.

    // let skipLoop = true;
    // We can use the below to generate constellation data.
    switch (starIndex) {
      // Orion
      // -----------------------------------------------------------
      case 1948: // Alnitak A  [belt]
      case 1949: // Alnitak B  [belt]
      case 1903: // Alnilam    [belt]
      case 1852: // Mintaka    [belt]
      case 2061: // Betelgeuse
      case 1713: // Rigel
      case 1790: // Bellatrix
      case 2004: // Saiph
      case 1879: // Meissa A
      case 1880: // Meissa B
      case 2124: // Mu Orionis
      case 2199: // Xi Orionis
      case 2130: // 64 Orionis
      case 2159: // Nu Orionis
      case 2047: // Chi1 Orionis
      case 1543: // Pi3 Orionis
      case 1544: // Pi2 Orionis
      case 1570: // Pi1 Orionis
      case 1552: // Pi4 Orionis
      case 1562: // 5 Orionis
      case 1567: // Pi5 Orionis
      case 1601: // Pi6 Orionis
      // The Great Dog
      // -----------------------------------------------------------
      case 2491: // Sirius (Dog's majestic chest)
      case 2294: // Mirzam (front leg)
      case 2429: // nu.02 CMa (chest)
      case 2414: // ksi02 CMa (front leg)
      case 2596: // iot CMa (upper neck)
      case 2657: // Muliphein (ear)
      case 2574: // Theta Canis Majoris (nose)
      case 2580: // omi01 CMa (belly)
      case 2653: // omi02 CMa (back)
      case 2693: // Wezen (ass)
      case 2749: // ome CMa (tail)
      case 2827: // Aludra (tail end)
      case 2618: // Adhara (upper leg)
      case 2538: // (rear left foot)
      case 2282: // Furud (rear rear foot)
        break;
      // // Gemini
      // // -----------------------------------------------------------
      // case 2990: // Pollux (right head)
      // case 2905: // ups Gem (right neck)
      // case 2891: // Castor A (left head)
      // case 2890: // Castor B (also left head)
      // case 2697: // tau Gem (left neck)
      // case 2821: // (joined shoulder)
      // case 2985: // (right shoulder)
      // case 2540: // (left shoulder)
      // case 2473: // Mebsuta (voluptuous left)
      // case 2286: // (left side right leg)
      // case 2343: // Tejat (left side left leg vert 1)
      // case 2216: // Propus (left side left leg vert 2)
      // case 2134: // (left side left leg vert 3)
      // case 2777: // Wasat (voluptuous right)
      // case 2650: // Mekbuda (right side left knee)
      // case 2421: // Alhena (right side left foot)
      // case 2763: // (right side right knee)
      // case 2484: // (right side right foot)
      //   break;
      // // Libra
      // // -----------------------------------------------------------
      // case 5531: // Zubenelgenubi (base)
      // case 5603: // Brachium (left)
      // case 5685: // Zubeneschamali (right)
      // case 5787: // Zubenelhakrabi (neck) | TODO: add NAME entry Zuben Elakrab to database.
      // case 5908: // tet Lib
      //   break;
      // Scorpius
      // -----------------------------------------------------------
      case 6134: // Antares (head)
      case 5984: // Acrab | bet01 Sco (left pincer) // TODO: add NAME entry Acrab to DB.
      case 5953: // Dschubba (middle pincer)
      case 5944: // V* pi. Sco (right pincer)
      case 6241: // eps Sco (body)
      case 6247: // mu.01 Sco (tail vert 1)
      case 6271: // Grafias | zet02 Sco (tail vert 2) // TODO: add NAME entry Grafias to DB.
      case 6380: // eta Sco (tail vert 3)
      case 6553: // Sargas (tail vert 4)
      case 6615: // iot01 Sco (tail vert 5)
      case 6580: // kap Sco (tail vert 6)
      case 6527: // Shaula (tail vert 7)
      case 6508: // Final (tail vert 8)
        break;
      // Crux | Southern cross
      // -----------------------------------------------------------
      case 4656: // del Cru (left)
      case 4853: // Mimosa (right)
      case 4763: // Gacrux (top)
      case 4730: // alf01 Cru (aka Acrux, bottom)
      case 4731: // alf02 Cru (aka Acrux, bottom)
        break;
      // Alpha Centauri
      // -----------------------------------------------------------
      case 5459: // Rigel kent (not to be confused with Rigel). Including for test's sake.
      case 5460: // Toliman.
        break;
      // Ursa minor | Northern indicator
      // -----------------------------------------------------------
      case 424: // Polaris (north star)
      case 6789: // Yildun
      case 6322: // eps UMi
      case 5903: // zet UMi
      case 5563: // Kochab
      case 5735: // Pherkad
      case 6116: // eta UMi
        break;
      // Lyra
      // -----------------------------------------------------------
      case 7001: // Vega
      case 7056: // zet01 Lyr
      case 7139: // del02 Lyr
      case 7178: // Sulafat
      case 7106: // Sheliak
        break;
      // Phoenix
      // -----------------------------------------------------------
      case 99: // Ankaa (eye)
      case 25: // (beak)
      case 100: // (neck)
      case 429: // (wing)
      case 338: // (other wing)
      case 322: // (body)
      case 440: // (tail)
      case 555: // (other part of tail)
        break;
      // Corvus
      // -----------------------------------------------------------
      case 4623: // Alchiba (beak)
      case 4630: // Minkar (eye)
      case 4662: // Gienah (wing)
      case 4757: // Algorab (rear)
      case 4786: // Kraz (foot)
        break;
      // Leo
      // -----------------------------------------------------------
      case 3873: // Algenubi // TODO: add NAME entry to DB.
      case 3905: // Rasalas
      case 4031: // Adhafera
      case 4057: // 41 Leo A | Algieba // TODO: add NAME entry to DB.
      case 4058: // 41 Leo B | Algieba // TODO: add NAME entry to DB.
      case 3975: // Al'dzhabkhakh // TODO: add NAME entry to DB.
      case 3982: // Regulus
      case 4359: // Chertan
      case 4534: // Denebola
      case 4357: // Zosma
        break;
      default: // bookm
        continue;
    }

    validStars.push(star);
  }

  return scene;
}

startupEmitter.on(startupEvent.ready, () => {
  const scene = $game.spaceScene;

  // TODO: Add LMC, SMC, Andromeda.

  // const pointColor = new THREE.Color();
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
      // TODO: Remove if.
      // if (!window.COLOUR_WARN && star.i > 590) {
        window.COLOUR_WARN = 1;
        console.warn(star.n, 'has invalid colour; setting generic placeholder. Dump:', star);
      // }
      // 6400 K colour, medium white.
      star.K = { r: 1, g: 0.9357, b: 0.9396 };
    }
    // pointColor.setHex(star.c.replace('#', '0x'));
    // pointColor.toArray(color, i * 3);

    // TODO: uncomment me:
    // glowColor.setHex(star.k.replace('#', '0x'));
    // glowColor.toArray(glow, i * 3);
    glow.push(star.K.r);
    glow.push(star.K.g);
    glow.push(star.K.b);
    // console.log(`${star.K.r}${star.K.r}${star.K.r}`)

    luminosity[i] = star.N;
    distance[i] = star.p;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  // geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
  geometry.setAttribute('glow', new THREE.Float32BufferAttribute(glow, 3));
  geometry.setAttribute('luminosity', new THREE.Float32BufferAttribute(luminosity, 1));
  geometry.setAttribute('distance', new THREE.Float32BufferAttribute(distance, 1));

  const { vertexShader, fragmentShader } = getShader('starfield-blackbody');
  // const material = new THREE.RawShaderMaterial({
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

export default {
  name: 'localCluster',
  register,
}
