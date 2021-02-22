import * as THREE from 'three';

// Taken from: https://threejs.org/examples/?q=pointer#misc_controls_pointerlock
export default function generate({ position, scene, cubeCount=3000, distanceMultiplier=1 }) {
  const {x,y,z} = position;
  console.log(`using position: ${x},${y},${z}`);

  const color = new THREE.Color();
  const objects = [];
  // const colorsFloor = [];

  for ( let i = 0, l = position.count; i < l; i ++ ) {

    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colorsFloor.push( color.r, color.g, color.b );

  }

  // floorGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFloor, 3 ) );

  const floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: true } );

  // const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  // scene.add( floor );

  // objects

  const boxGeometry = new THREE.BoxBufferGeometry( 20, 20, 20 ).toNonIndexed();

  // position = boxGeometry.attributes.position;
  const colourVec = new THREE.Vector3(0, 0, 0);
  colourVec.copy(position);
  const colorsBox = [];

  for ( let i = 0, l = colourVec.count; i < l; i ++ ) {

    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colorsBox.push( color.r, color.g, color.b );

  }

  boxGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsBox, 3 ) );

  for (let i = 0; i < (cubeCount); i++) {

    const colour = Math.floor(Math.random() * (16777215 + 1));
    // const boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: true } );
    const boxMaterial = new THREE.MeshLambertMaterial( { emissive: colour, flatShading: true, vertexColors: true } );
    boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    const box = new THREE.Mesh( boxGeometry, boxMaterial );
    box.position.x = ((Math.floor( Math.random() * 20 - 10 ) * 35 * distanceMultiplier) + position.x);
    box.position.y = ((Math.floor( Math.random() * 20 - 10 ) * 35 * distanceMultiplier) + position.y);
    box.position.z = ((Math.floor( Math.random() * 20 - 10 ) * 35 * distanceMultiplier) + position.z);
    // console.log(box.position)
    box.rotation.setFromVector3(new THREE.Vector3(rrad(), rrad(), rrad()));

    scene.add( box );
    objects.push( box );
  }

  return objects;
}

/** Returns a random radian (0-1.5780) */
function rrad() {
  return Math.random() * 1.5780;
}
