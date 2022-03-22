import { shader } from '../index';
import AssetFinder from '../../local/AssetFinder';
import fs from 'fs';
import * as THREE from 'three';

// Example:
//     starfieldBlackbody.createMesh({
//       callback: (mesh) => {
//         console.log('example:', { mesh });
//       }
//     });
function createMesh({ callback }) {
  AssetFinder.getStarCatalogWFallback({
    name: 'constellation_test',
    callback: (error, fileName, parentDir) => {
      fs.readFile(`./${parentDir}/${fileName}`, (error, catalogBlob) => {
        if (error) {
          console.error('Fata error loading star catalog:', error);
        }
        else {
          const stars = JSON.parse(catalogBlob);

          const color = [];
          const glow = [];
          const luminosity = [];
          const vertices = [];

          for (let i = 0; i < stars.length; i++) {
            const star = stars[i];

            // Place everything near the camera.
            // const position = new THREE.Vector3(star.x, star.y, star.z).normalize();
            vertices.push(star.x, star.y, star.z);

            if (!star.K) {
              console.warn(star.n, 'has invalid colour; setting generic placeholder. Dump:', star);
              // 6400 K colour, medium white.
              star.K = { r: 1, g: 0.9357, b: 0.9396 };
            }

            glow.push(star.K.r);
            glow.push(star.K.g);
            glow.push(star.K.b);

            luminosity[i] = star.N;
          }

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
          geometry.setAttribute('glow', new THREE.Float32BufferAttribute(glow, 3));
          geometry.setAttribute('luminosity', new THREE.Float32BufferAttribute(luminosity, 1));

          const { vertexShader, fragmentShader } = shader.starfieldBlackbody;
          const material = new THREE.ShaderMaterial({
            depthWrite: false,
            uniforms: {
              alphaTest: { value: 0.9 },
              rWidth: (1 / window.innerWidth) / 100,
              rHeight: (1 / window.innerHeight) / 100,
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            extensions: {
              drawBuffers: true,
            },
          });

          const particles = new THREE.Points(geometry, material);
          callback({ mesh: particles });
        }
      });
    }
  });
}

export default { createMesh };
