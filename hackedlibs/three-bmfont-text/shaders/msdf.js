
module.exports = function createMSDFShader (opt) {
  opt = opt || {};
  var opacity = typeof opt.opacity === 'number' ? opt.opacity : 1;
  var alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001;
  var precision = opt.precision || 'highp';
  var color = opt.color;
  var map = opt.map;
  var negate = typeof opt.negate === 'boolean' ? opt.negate : true;
  const isWebGL2 =typeof opt.isWebGL2 === 'boolean' ? opt.isWebGL2 : true;
  // remove to satisfy r73
  delete opt.map;
  delete opt.color;
  delete opt.precision;
  delete opt.opacity;
  delete opt.negate;
  delete opt.isWebGL2;
  
  /*
    WebGL1 compatible shaders
  */
  
  const vertexShader_WebGL1= [
    'attribute vec2 uv;',
    'attribute vec4 position;',
    'uniform mat4 projectionMatrix;',
    'uniform mat4 modelViewMatrix;',
    'varying vec2 vUv;',
    'void main() {',
    'vUv = uv;',
    'gl_Position = projectionMatrix * modelViewMatrix * position;',
    '}'
  ];

  const fragShader_WebGL1=[
    '#ifdef GL_OES_standard_derivatives',
    '#extension GL_OES_standard_derivatives : enable',
    '#endif',
    'precision ' + precision + ' float;',
    'uniform float opacity;',
    'uniform vec3 color;',
    'uniform sampler2D map;',
    'varying vec2 vUv;',
  
    'float median(float r, float g, float b) {',
    '  return max(min(r, g), min(max(r, g), b));',
    '}',
  
    'void main() {',
    '  vec3 sample = ' + (negate ? '1.0 - ' : '') + 'texture2D(map, vUv).rgb;',
    '  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;',
    '  float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);',
    '  gl_FragColor = vec4(color.xyz, alpha * opacity);',
    alphaTest === 0
      ? ''
      : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
    '}'
  ];

  /*
    WebGL2 compatible shaders
  */

  const vertexShader_WebGL2= [
    '#version 300 es',
    'in vec2 uv;',
    'in vec4 position;',
    'uniform mat4 projectionMatrix;',
    'uniform mat4 modelViewMatrix;',
    'out vec2 vUv;',
    'void main() {',
    'vUv = uv;',
    'gl_Position = projectionMatrix * modelViewMatrix * position;',
    '}'
  ];

  const fragShader_WebGL2=[
    '#version 300 es',
    'precision ' + precision + ' float;',
    'uniform float opacity;',
    'uniform vec3 color;',
    'uniform sampler2D map;',
    'in vec2 vUv;',
    'out vec4 fragColor;',
  
    'float median(float r, float g, float b) {',
    '  return max(min(r, g), min(max(r, g), b));',
    '}',
  
    'void main() {',
    '  vec3 s = ' + (negate ? '1.0 - ' : '') + 'texture(map, vUv).rgb;',
    '  float sigDist = median(s.r, s.g, s.b) - 0.5;',
    '  float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);',
    '  fragColor = vec4(color.xyz, alpha * opacity);',
    alphaTest === 0
      ? ''
      : '  if (fragColor.a < ' + alphaTest + ') discard;',
    '}'
  ];
  
  

  return Object.assign({
    uniforms: {
      opacity: { type: 'f', value: opacity },
      map: { type: 't', value: map || new THREE.Texture() },
      color: { type: 'c', value: new THREE.Color(color) }
    },
    vertexShader:(isWebGL2===true?vertexShader_WebGL2:vertexShader_WebGL1).join('\n'),
    fragmentShader: (isWebGL2===true?fragShader_WebGL2:fragShader_WebGL1).join('\n')
  }, opt);
};
