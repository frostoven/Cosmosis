import * as THREE from 'three';
import airyGlow from './airyGlow.glsl';
import example from './example.glsl';
import starfieldBlackbody from './starfieldBlackbody.glsl';
import wisp from './wisp.glsl';

// All loaded shaders are stored here.
const shader = {
  airyGlow,
  example,
  starfieldBlackbody,
  wisp,
};

/**
 *
 * @param {shader} shader - Shader object to use.
 * @param {object} [options] - directly passed through to ShaderMaterial, and
 * therefore supports whatever ShaderMaterial supports.
 */
function createShaderMaterial({ shader, options={} }) {
  return new THREE.ShaderMaterial({
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    ...options,
  });
}

export {
  shader,
  createShaderMaterial,
}
