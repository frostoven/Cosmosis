function init() {

  container = document.getElementById( 'container' );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 500;

  scene = new THREE.Scene();

  var data = generateHeight( 1024, 1024 );
  var texture = new THREE.Texture( generateTexture( data, 1024, 1024 ) );
  texture.needsUpdate = true;

  var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: false } );

  var quality = 16, step = 1024 / quality;

  // the geometry the heightmap should be applied to

  var plane = new THREE.SphereGeometry(256, 64, 64);

  for ( var i = 0, l = plane.vertices.length; i < l; i ++ ) {

    var x = i % quality, y = ~~ ( i / quality );
    //plane.vertices[ i ].y = data[ ( x * step ) + ( y * step ) * 1024 ] * 2 - 128;
    // changing points randomly instead of reading off of a height map
    plane.vertices[ i ].x += Math.floor((Math.random()*50)+1) - 25;
    plane.vertices[ i ].y += Math.floor((Math.random()*100)+1) - 50;
    plane.vertices[ i ].z += Math.floor((Math.random()*50)+1) - 25;
  }

  plane.computeCentroids();
  plane.computeFaceNormals();


  mesh = new THREE.Mesh( plane, material );
  scene.add( mesh );



  renderer = new THREE.CanvasRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.innerHTML = "";

  container.appendChild( renderer.domElement );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );

  //

  window.addEventListener( 'resize', onWindowResize, false );

}

// https://stackoverflow.com/questions/18363357/apply-heightmap-to-spheregeometry-in-three-js
function generateHeight( width, height ) {
  var data = Float32Array ? new Float32Array(width * height) : [], perlin = new ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 100;

  for (var i = 0; i < size; i++) {
    data[i] = 0;
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
