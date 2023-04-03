import * as THREE from 'three';
import airyGlow from './airyGlow.glsl';
import example from './example.glsl';
import milkyWay from './milkyWay.glsl';
import starfieldBlackbody from './starfieldBlackbody.glsl';
import wisp from './wisp.glsl';

// All loaded shaders are stored here.
const shader = {
  airyGlow,
  example,
  milkyWay,
  starfieldBlackbody,
  wisp,
};

const shaderMaterialCache = {};

/**
 *
 * @param {shader} shader - Shader object to use.
 * @param {object} [options] - Directly passed through to ShaderMaterial, and
 *  therefore supports whatever ShaderMaterial supports.
 * @param {boolean} [allowReuse] - If true, you may be returned a memoized
 *   material already used elsewhere. Note that your options are not evaluated
 *   if you're given a cached result.
 */
function createShaderMaterial({ shader, options = {}, allowReuse = true }) {
  if (allowReuse && shaderMaterialCache[shader]) {
    return shaderMaterialCache[shader];
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    ...options,
  });

  shaderMaterialCache[shader] = material;
  return material;
}

export {
  shader,
  createShaderMaterial,
}
