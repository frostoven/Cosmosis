import * as THREE from 'three';
// import { getShader } from '../../shaders';

const spectralCombinations = {};

function createScene({ scene, catalog, onLoaded=()=>{} }) {
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

  populateSky({ scene, validStars, onLoaded });
}

function init({ catalogJson, onLoaded=()=>{} }) {
  const scene = new THREE.Scene();
  createScene({ scene, catalog: catalogJson, onLoaded });
  return scene;
}

// TODO: continue here: this should be loaded after catalog has been loaded.
function populateSky({ scene, validStars, onLoaded=()=>{} }) {
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
  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      alphaTest: { value: 0.9 },
    },
    // TODO: REMOVE THIS. Temporarily hard-coding shaders here because the
    //  current setup requires `fs`, which web workers do not have. I'd
    //  rather not include the shader loading mechanism in this commit, so
    //  we're just pasting it here.
    //  DO NOT MERGE INTO MASTER BRANCH.
    vertexShader:
      `
#define PI 3.141592653589
#define RLOG10 (1.0 / log(10.0))
attribute vec3 glow;attribute float luminosity;varying vec3 vGlow;varying float pointSize;varying float lum;
float log10(float number) {return RLOG10 * log(number);}
void main() {vGlow = normalize(glow);vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);float brightness = luminosity / pow(4.0 * PI * -mvPosition.z, 2.0);pointSize = log10(brightness * 500000.0) + (log((brightness * 7500.0)) * 1.75);
if (pointSize < 2.0) {pointSize = log10(brightness * 500000.0) + (brightness * 3500.0);}gl_PointSize = pointSize;gl_Position = projectionMatrix * mvPosition;}
      `,
    fragmentShader:
      `
#define PI 3.141592653589
#define MIN_SIZE (1.75)
#define MIN_SIZE_FACTOR (1.0 / MIN_SIZE)
#define COLORFUL_DISTANT 0
varying vec3 vGlow;varying float pointSize;varying float lum;
void main() {if (pointSize == 0.0 || isinf(pointSize) || isnan(pointSize)) {discard;}if (pointSize < MIN_SIZE) {gl_FragColor = vec4(mix(vGlow, vec3(1.0, 1.0, 1.0), 0.95),max(pointSize * MIN_SIZE_FACTOR, 0.1));return;}float scale  = 7500.0;
float invRadius = 50.0;float invGlowRadius = 3.0;vec2 position = gl_PointCoord;position.x -= 0.5;position.y -= 0.5;
float diskScale = length(position) * invRadius;vec3 spectrum  = scale * vGlow;vec3 glow = spectrum / pow(diskScale, invGlowRadius);gl_FragColor = vec4(glow, (glow.r + glow.g + glow.b) / 3.0 * 1.1 - 0.1);}`,
    transparent: true,
    // depthTest: false,
    extensions: {
      drawBuffers: true,
    },
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  onLoaded();
}

export default {
  init,
}
