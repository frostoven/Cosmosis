// Generate a number of text labels, from 1µm in size up to 100,000,000 light years
// Try to use some descriptive real-world examples of objects at each scale

import * as THREE from 'three';

import core from '../local/core';

var quality = 16, step = 1024 / quality;

// Note on label data - if for whatever insane reason we'd ever want to go
// below 1cm size, use scale instead.
const labelData = [
  // TODO: load via planetary system and use the res loader.
  {
    name: 'sun',
    size: 1392700000, // 1,392,700 km
    reflectivity: 0,
    scale: 1.0,
    brightness: 10,
    grouped: false,
    nogroupOffset: 149540000000,
    image: 'prodHqAssets/planetImg/sun_euvi_aia304_2012_carrington.jpg',
  },
  {
    name: 'moon',
    // https://www.scientificamerican.com/article/why-do-the-moon-and-the-s/#:~:text=Because%20the%20moon%20is%20changing,the%20moon%20appear%20very%20large
    size: 3474000, // 3,474 km
    reflectivity: 0.12, // yes, it's actually that high.
    scale: 1.0,
    grouped: false,
    nogroupOffset: -384400000,
    image: 'prodHqAssets/planetImg/Moon_lroc_color_poles_8k.jpg',
  },
  {
    name: 'earth',
    size: 12742000, // 12,742 km
    reflectivity: 0.3, // yes, it's actually that low.
    scale: 1.0,
    grouped: false,
    nogroupOffset: 0,
    image: 'prodHqAssets/planetImg/Land_ocean_ice_cloud_hires.jpg',
  },

  // Going to miss these. They really helped me prototype the initial system.
  // Maybe one day I can offer the original authors my thanks.
  // {size: 7.47e12, scale: 1.0, label: "solar system (50Au)"},
  // {size: 9.4605284e15, scale: 1.0, label: "gargantuan (1 light year)"},
  // {size: 3.08567758e16, scale: 1.0, label: "ludicrous (1 parsec)"},
  // {size: 1e19, scale: 1.0, label: "mind boggling (1000 light years)"}
];

function register() {
  core.registerScene({
    name: 'localCluster',
    init,
  });
}

function init({ font }) {
  const scene = new THREE.Scene();

  // Massive space bodies part below.
  const geometry = new THREE.SphereBufferGeometry(0.5, 24*10, 12*10);

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

    const labelGeo = new THREE.TextBufferGeometry(body.name, {
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

    if (body.image) {
      const loader = new THREE.TextureLoader();
      loader.load( body.image, function ( texture ) {

        // var plane = new THREE.SphereGeometry(4096, 64, 64);
        // for ( var i = 0, l = plane.vertices.length; i < l; i ++ ) {
        //   var x = i % quality, y = ~~ ( i / quality );
        //   //plane.vertices[ i ].y = data[ ( x * step ) + ( y * step ) * 1024 ] * 2 - 128;
        //   // changing points randomly instead of reading off of a height map
        //   plane.vertices[ i ].x += Math.floor((Math.random()*50)+1) - 25;
        //   plane.vertices[ i ].y += Math.floor((Math.random()*100)+1) - 50;
        //   plane.vertices[ i ].z += Math.floor((Math.random()*50)+1) - 25;
        // }
        // // plane.computeCentroids();
        // plane.computeFaceNormals();

        // const material = new THREE.MeshBasicMaterial({map: texture});

        // We'll probably want to do most reflectivity with shaders (because
        // reflections would be unevenly distributed, ex. ocean vs land).
        let material;
        let castShadow = false;
        let receiveShadow = true;

        if (!body.reflectivity) {
          // If has no reflectivity, may as well go with something cheaper that
          // doesn't support reflectivity at all (usually used for stars).
          material = new THREE.MeshBasicMaterial({ map: texture });
          receiveShadow = false;
        }
        else {
          material = new THREE.MeshPhongMaterial({ map: texture });
          material.reflectivity = body.reflectivity;
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;

        // const mesh = new THREE.Mesh(plane, material);
        // mesh.position.y = -body.size / 4 * scale;

        if (body.grouped === false) {
          mesh.scale.multiplyScalar(body.size * scale);
          // mesh.updateMatrix();
          mesh.position.x = body.nogroupOffset;
          scene.add(mesh);
        }
        else {
          // mesh.scale.multiplyScalar(body.size * scale);
          // group.add(mesh);
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

// TODO: figure out wtf is going on here.
//  So, very simply: 3000 cubes @ 4 verts each = 12,000 verts = 11fps on an RTX 2080TI.
//  Or, add a compressed gltf scene from blender with 2 million verts - 60 fps constant. wut..?
//  The real confusing part here is the actual resource usage - CPU 10%, GPU 20%, RAM 50%. I.e system
//  not being utilised.
// startupEmitter.on(startupEvent.ready, () => {
//   const objects = generateCubeField({
//     scene: $game.levelScene,
//     position: $game.camera.position,
//   });
//   console.log('cube space:', objects);
// });

// startupEmitter.on(startupEvent.ready, () => {
//   const objects = generateCubeField({
//     scene: $game.levelScene,
//     position: $game.camera.position,
//     cubeCount: 25,
//     distanceMultiplier: 0.5
//   });
// });

// startupEmitter.on(startupEvent.ready, () => {
  // const objects = generateCubeField({
  //   scene: $game.levelScene,
  //   position: $game.camera.position,
  //   cubeCount: 100,
  // });
  // console.log('cube space:', objects);
// });

// https://stackoverflow.com/questions/18363357/apply-heightmap-to-spheregeometry-in-three-js
function generateHeight( width, height ) {
  var data = Float32Array ? new Float32Array(width * height) : [], perlin = new ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 100;

  for (var i = 0; i < size; i++) {
    data[i] = 0
  }

  for (var j = 0; j < 4; j++) {
    quality *= 4;
    for (var i = 0; i < size; i++) {
      var x = i % width, y = ~~(i / width);
      data[i] += Math.floor(Math.abs(perlin.noise(x / quality, y / quality, z) * 0.5) * quality + 10);
    }
  }
  return data;
}

// https://stackoverflow.com/questions/18363357/apply-heightmap-to-spheregeometry-in-three-js
function generateTexture( data, width, height ) {
  var canvas, context, image, imageData,
    level, diff, vector3, sun, shade;

  vector3 = new THREE.Vector3(0, 0, 0);

  sun = new THREE.Vector3(1, 1, 1);
  sun.normalize();

  canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  image = context.getImageData(0, 0, width, height);
  imageData = image.data;

  for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

    vector3.x = data[j - 1] - data[j + 1];
    vector3.y = 2;
    vector3.z = data[j - width] - data[j + width];
    vector3.normalize();

    shade = vector3.dot(sun);

    imageData[i] = (96 + shade * 128) * (data[j] * 0.007);
    imageData[i + 1] = (32 + shade * 96) * (data[j] * 0.007);
    imageData[i + 2] = (shade * 96) * (data[j] * 0.007);
  }

  context.putImageData(image, 0, 0);
  return canvas;
}


export default {
  name: 'localCluster',
  register,
}
