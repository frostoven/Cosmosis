// Generate a number of text labels, from 1µm in size up to 100,000,000 light years
// Try to use some descriptive real-world examples of objects at each scale

import * as THREE from 'three';

import core from '../local/core';

const labelData = [
  {size: .01, scale: 0.0001, label: "microscopic (1µm)"}, // FIXME - triangulating text fails at this size, so we scale instead
  {size: .01, scale: 0.1, label: "minuscule (1mm)"},
  {size: .01, scale: 1.0, label: "tiny (1cm)"},
  {size: 1, scale: 1.0, label: "child-sized (1m)"},
  {size: 10, scale: 1.0, label: "tree-sized (10m)"},
  {size: 100, scale: 1.0, label: "building-sized (100m)"},
  {size: 1000, scale: 1.0, label: "medium (1km)"},
  {size: 10000, scale: 1.0, label: "city-sized (10km)"},
  {size: 3400000, scale: 1.0, label: "moon-sized (3,400 Km)"},
  {size: 12000000, scale: 1.0, label: "planet-sized (12,000 km)"},
  {size: 1400000000, scale: 1.0, label: "sun-sized (1,400,000 km)"},
  {size: 7.47e12, scale: 1.0, label: "solar system-sized (50Au)"},
  {size: 9.4605284e15, scale: 1.0, label: "gargantuan (1 light year)"},
  {size: 3.08567758e16, scale: 1.0, label: "ludicrous (1 parsec)"},
  {size: 1e19, scale: 1.0, label: "mind boggling (1000 light years)"}
];

// function register() {
//   core.registerScene({
//     name: 'logDepthDemo',
//     init,
//   })
// }

function init({ font }) {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0x222222));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(100, 100, 100);
  scene.add(light);

  const materialArgs = {
    color: 0xffffff,
    specular: 0x050505,
    shininess: 50,
    emissive: 0x000000
  };

  // Massive space bodies part below.
  const geometry = new THREE.SphereBufferGeometry(0.5, 24, 12);

  for (let i = 0; i < labelData.length; i++) {
    const scale = labelData[i].scale || 1;

    const labelGeo = new THREE.TextBufferGeometry(labelData[i].label, {
      font: font,
      size: labelData[i].size,
      height: labelData[i].size / 2
    });

    labelGeo.computeBoundingSphere();

    // center text
    labelGeo.translate(-labelGeo.boundingSphere.radius, 0, 0);

    materialArgs.color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);

    const material = new THREE.MeshPhongMaterial(materialArgs);

    const group = new THREE.Group();
    group.position.z = -labelData[i].size * scale;
    scene.add(group);

    const textMesh = new THREE.Mesh(labelGeo, material);
    textMesh.scale.set(scale, scale, scale);
    textMesh.position.z = -labelData[i].size * scale;
    textMesh.position.y = labelData[i].size / 4 * scale;
    group.add(textMesh);

    const dotMesh = new THREE.Mesh(geometry, material);
    dotMesh.position.y = -labelData[i].size / 4 * scale;
    dotMesh.scale.multiplyScalar(labelData[i].size * scale);
    group.add(dotMesh);

  }
  return scene;
}

// export default {
//   name: 'logDepthDemo',
//   init,
// }

// export default {
//   name: 'logDepthDemo',
//   register,
// }

const definition = {
  init,
  // register,
};

export default definition;
