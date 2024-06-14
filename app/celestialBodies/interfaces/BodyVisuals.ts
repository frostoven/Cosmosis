import * as THREE from 'three';

interface BodyVisuals {
  getTexture: () => THREE.Texture | null,
  getMaterial: () => THREE.Material,
  // TODO: Implement an initial bump (or normal) map which evolves into actual
  //  geo.
}

export {
  BodyVisuals,
};
