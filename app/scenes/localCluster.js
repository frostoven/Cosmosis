// Generate a number of text labels, from 1µm in size up to 100,000,000 light years
// Try to use some descriptive real-world examples of objects at each scale

import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import Unit from '../local/Unit';

// const demo = new CANNON.Demo();
// console.log(demo)

var quality = 16, step = 1024 / quality;

const labelData = [
  // {size: .01, scale: 0.0001, label: "microscopic (1µm)"}, // FIXME - triangulating text fails at this size, so we scale instead
  // {size: .01, scale: 0.1, label: "minuscule (1mm)"},
  // {size: .01, scale: 1.0, label: "tiny (1cm)"},
  // {size: 1, scale: 1.0, label: "child (1m)"},
  // {size: 10, scale: 1.0, label: "tree (10m)"},
  // {size: 100, scale: 1.0, label: "building (100m)"},
  // {size: 1000, scale: 1.0, label: "medium (1km)"},
  // {size: 10000, scale: 1.0, label: "city (10km)"},
  // https://www.scientificamerican.com/article/why-do-the-moon-and-the-s/#:~:text=Because%20the%20moon%20is%20changing,the%20moon%20appear%20very%20large.
  // TODO: make these use the res loader.
  {size: 3474000, scale: 1.0, label: "moon (3,474 Km)", grouped: false, nogroupOffset: -384400000, image: 'prodHqAssets/planetImg/Moon_lroc_color_poles_8k.jpg'},
  {size: 12742000, scale: 1.0, label: "earth (12,742 km)", grouped: false, nogroupOffset: 0, image: 'prodHqAssets/planetImg/Land_ocean_ice_cloud_hires.jpg'},
  {size: 1392700000, scale: 1.0, label: "sun (1,392,700 km)", brightness: 10, grouped: false, nogroupOffset: 149540000000, image: 'prodHqAssets/planetImg/sun_euvi_aia304_2012_carrington.jpg'},
  // {size: 3474000, scale: 1.0, label: "moon (3,474 Km)", grouped: false, nogroupOffset: 384400000, image: 'potatoLqAssets/planetImg/Moon_lroc_color_poles_8k.jpg'},
  // {size: 12742000, scale: 1.0, label: "earth (12,742 km)", grouped: false, nogroupOffset: 0, image: 'potatoLqAssets/planetImg/Land_ocean_ice_cloud_hires.jpg'},
  // {size: 1392700000, scale: 1.0, label: "sun (1,392,700 km)", brightness: 10, grouped: false, nogroupOffset: -149540000000, image: 'potatoLqAssets/planetImg/sun_euvi_aia304_2012_carrington.jpg'},
  // {size: 7.47e12, scale: 1.0, label: "solar system (50Au)"},
  // {size: 9.4605284e15, scale: 1.0, label: "gargantuan (1 light year)"},
  // {size: 3.08567758e16, scale: 1.0, label: "ludicrous (1 parsec)"},
  // {size: 1e19, scale: 1.0, label: "mind boggling (1000 light years)"}
];


function init() {
  const scene = new THREE.Scene();

  $game.event.offscreenSkyboxReady.getOnce(() => {
    $webWorkers.offscreenSkybox.getVisibleStars({
      x: 0, y: 0, z: 0,
      callback: (data) => {
        console.log('--> [localCluster] star data:', data);
        generateStars({ scene, data: data.result });
      },
    });
  });

  return scene;
}

function createStarMesh({ x, y, z, K }) {
  const unit = Unit.parsec.inMeters;
  x *= unit;
  y *= unit;
  z *= unit;
  const radius = 696340000; // sun's radius
  // TODO: start this off as non-detailed (maybe 40x20 or less), and only
  //  increase to 240x120 when the user gets close. You might even have a
  //  single 240x120 that it 'snapped' and resized to closest star positions
  //  (i.e. ever single star is the same instance). Then when you get far
  //  enough, replace with shader dot and move star to another position.
  const geometry = new THREE.SphereBufferGeometry(radius, 240, 120);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(K.r, K.g, K.b),
    transparent: true,
    fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
}

function generateStars({ scene, data }) {
  const { stars, nearestStar } = data;
  for (let i = 0, len = stars.length; i < len; i++) {
    const star = stars[i];
    const mesh = createStarMesh(star);
    scene.add(mesh);

    // TODO: apply this for nearest star instead of only sun.
    if (star.n === 'Sol') {
      // Add postprocessing effects.
      $gfx.spaceEffects.getOnce((context) => {
        context.setGodRays({ mesh });
      });
    }
  }
}

function initTestsWithText({ font }) {
  const scene = new THREE.Scene();
  // scene.add(new THREE.AmbientLight(0x222222));
  // const light = new THREE.DirectionalLight(0xffffff, 1);
  // light.position.set(100, 100, 100);
  // scene.add(light);

  // Massive space bodies part below.
  const geometry = new THREE.SphereBufferGeometry(0.5, 24*10, 12*10);

  // var data = generateHeight( 1024, 1024 );
  // var texture = new THREE.Texture( generateTexture( data, 1024, 1024 ) );
  // texture.needsUpdate = true;

  for (let i = 0; i < labelData.length; i++) {
    const body = labelData[i];
    const scale = body.scale || 1;

    const materialArgs = {
      color: 0xffffff,
      specular: 0x050505,
      shininess: 50,
      emissive: 0x000000,
      emissiveIntensity: body.brightness ? body.brightness : 1,
    };

    const labelGeo = new TextGeometry(body.label, {
      font: font,
      size: body.size,
      height: body.size / 2
    });

    labelGeo.computeBoundingSphere();

    // center text
    labelGeo.translate(-labelGeo.boundingSphere.radius, 0, 0);

    const group = new THREE.Group();
    group.position.z = -body.size * scale;
    scene.add(group);

    materialArgs.color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial(materialArgs);

    const textMesh = new THREE.Mesh(labelGeo, material);
    textMesh.scale.set(scale, scale, scale);
    textMesh.position.z = -body.size * scale;
    textMesh.position.y = body.size / 4 * scale;
    if (body.grouped !== false) {
      group.add(textMesh);
    }

    // console.log(`[z] ${body.label}:`, -body.size * scale);

    if (body.image) {
      const loader = new THREE.TextureLoader();
      loader.load( body.image, function ( texture ) {
        const material = new THREE.MeshBasicMaterial({map: texture});
        // const material = new THREE.MeshPhongMaterial({map: texture});
        const mesh = new THREE.Mesh(geometry, material);
        // mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (body.grouped === false) {
          mesh.scale.multiplyScalar(body.size * scale);
          // mesh.updateMatrix();
          mesh.position.x = body.nogroupOffset;
          scene.add(mesh);
        }
      });
    }
    else {
      const dotMesh = new THREE.Mesh(geometry, material);
      dotMesh.position.y = -body.size / 4 * scale;
      dotMesh.scale.multiplyScalar(body.size * scale);

      if (body.grouped !== false) {
        group.add(dotMesh);
      }
    }
  }
  return scene;
}

const definition = {
  init,
};

export default definition;
