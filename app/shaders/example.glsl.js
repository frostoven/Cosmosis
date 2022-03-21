// -- Docs and notes -------------------------------------------- //

// language=md
const license = `
  If the source of the shader is the internet, that license goes here. License
  details are not optional.
  
  If the license is exceptionally long, create a \`yourShader.license\` file
  and paste the license in there.
`;

// language=md
const description = `
  Basic example shader structure as expected by Cosmosis. If given a time
  uniform, will oscillate between red and yellow.

  Example use:
  https://jsfiddle.net/devilishfiddler/r5wkcbxf/
`;

// -- Vertex shader --------------------------------------------- //

// language=glsl
const vertexShader = `
  // Used by logdepthbuf_pars_vertex below.
  bool isPerspectiveMatrix(mat4) {
    return true;
  }

  // Three.js includes a convenient #import directive for internal shader
  // chunks (see THREE.ShaderChunk for examples).
  // Import functions needed for log-z calculations. You will probably need
  // this for most shaders.
  #include <logdepthbuf_pars_vertex>

  void main(){
    // Fix log-z position. You will probably need this for most shaders.
    #include <logdepthbuf_vertex>

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// -- Fragment shader ------------------------------------------- //

// language=glsl
const fragmentShader = `
  // Import functions needed for log-z calculations. You will probably need
  // this for most shaders.
  #include <logdepthbuf_pars_fragment>

  uniform float time;
  void main(void) {
    // Import functions needed for log-z calculations. You will probably need
    // this for most shaders.
    #include <logdepthbuf_fragment>
    
    gl_FragColor = vec4(1.0, (sin(time * 7.5) + 1.0) / 2.0, 0.0, 1.0);
  }
`;

// -- Exports --------------------------------------------------- //

export default {
  license,
  description,
  vertexShader,
  fragmentShader,
}
