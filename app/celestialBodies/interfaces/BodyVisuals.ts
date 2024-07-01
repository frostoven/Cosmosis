import * as THREE from 'three';

interface BodyVisuals {
  getTexture: () => THREE.Texture | null,
  getSphereMaterial: () => THREE.Material,
  getGlowMaterial: () => THREE.ShaderMaterial,
  // TODO: Implement an initial bump (or normal) map which evolves into actual
  //  geo.
}

export {
  BodyVisuals,
};
