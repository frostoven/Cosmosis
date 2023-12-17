import * as THREE from 'three';

// Draws numbers similar to a dice in 6 directions away from the camera to
// indicate which face you're looking at. Counts from 0 to 5. The square
// represents zero.
//
// [0] Front:   0, 0, -6
// [1] Back:    0, 0, 6
// [2] Top:     0, 6, 0  // cam faces up
// [3] Bottom:  0, -6, 0 // cam faces down
// [4] Left:   -6, 0, 0
// [5] Right:   6, 0, 0
function addDebugSideCounters(scene) {
  function createCube(size, x, y, z, colour, thin=false) {
    const geometry = new THREE.BoxGeometry(thin ? size / 4 : size, size, size);
    const material = new THREE.MeshBasicMaterial({color: colour});
    const cube = new THREE.Mesh(geometry, material);
    cube.translateX(x); cube.translateY(y); cube.translateZ(z);
    return cube;
  }

  // 0 (front)
  scene.add(createCube(3, 0, 0, -6, 0x5bff4f)); // light green
  scene.add(createCube(1.5, 0, 0, -4, 0x000000)); // create a hole to indicate 0
  // 1 (back)
  scene.add(createCube(3, 0, 0, 6, 0xffaa00, true)); // light orange
  // 2 (top)
  scene.add(createCube(1.5, 0, 6, 1, 0xfc3838)); // red
  scene.add(createCube(1.5, 0, 6, -1, 0xfc3838)); // red
  // 3 (bottom)
  scene.add(createCube(1.5, -1, -6, 2, 0x00aaff)); // light blue
  scene.add(createCube(1.5, 0, -6, 0, 0x00aaff)); // light blue
  scene.add(createCube(1.5, 1, -6, -2, 0x00aaff)); // light blue
  // 4 (left)
  scene.add(createCube(1.5, -6, 1, 1, 0xe8b4dd)); // dusty pink
  scene.add(createCube(1.5, -6, -1, 1, 0xe8b4dd)); // dusty pink
  scene.add(createCube(1.5, -6, 1, -1, 0xe8b4dd)); // dusty pink
  scene.add(createCube(1.5, -6, -1, -1, 0xe8b4dd)); // dusty pink
  // 5 (right)
  scene.add(createCube(0.75, 6, 1, 1,  0xfcf99f)); // yellow
  scene.add(createCube(0.75, 6, -1, 1, 0xfcf99f)); // yellow
  scene.add(createCube(0.75, 6, 1, -1, 0xfcf99f)); // yellow
  scene.add(createCube(0.75, 6, -1, -1, 0xfcf99f)); // yellow
  scene.add(createCube(0.75, 6, 0, 0, 0xfcf99f)); // yellow
}

// Used to checks that corners transition properly between cube corners in a
// skybox. If instead of 8 flat circles you get pie charts, then there's a
// problem with the skybox creation process or you're stuck in a nightmare of a
// corporate sales pitch.
function addDebugCornerIndicators(scene) {
  function createSphere(radius, x, y, z, colour) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: colour });
    const cube = new THREE.Mesh(geometry, material);
    cube.translateX(x);
    cube.translateY(y);
    cube.translateZ(z);
    return cube;
  }

  // 1/5/2
  scene.add(createSphere(1, 5, 5, 5, 0xe8b4dd)); // dusty pink
  // 0/3/5
  scene.add(createSphere(1, 5, -5, -5, 0xfc3838)); // red
  // 0/2/5
  scene.add(createSphere(1, 5, 5, -5, 0xffaa00)); // orange
  // 1/3/5
  scene.add(createSphere(1, 5, -5, 5, 0x88e3db)); // teal
  // 0/2/4
  scene.add(createSphere(1, -5, 5, -5, 0x5bff4f)); // light green
  // 1/3/4
  scene.add(createSphere(1, -5, -5, 5, 0xfcf99f)); // yellow
  // 1/2/4
  scene.add(createSphere(1, -5, 5, 5, 0xd717f4)); // magenta
  // 0/4/3
  scene.add(createSphere(1, -5, -5, -5, 0x00aaff)); // light blue
}

export {
  addDebugSideCounters,
  addDebugCornerIndicators,
}
