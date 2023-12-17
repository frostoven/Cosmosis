// -- Docs and notes -------------------------------------------- //

// language=md
const license = `
    This model is original work made for the Cosmosis project, and follows the
    same license.
`;

// language=md
const description = `
  Aims to have a realistic galaxy backdrop with configurable exposure. 
`;

// -- Vertex shader --------------------------------------------- //

// language=glsl
const vertexShader = `
  varying vec4 vColor;
  
  float maxY = 3.0;

  void main(){
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 1.0;
    
    vec4 bright = vec4(1.0, 0.992, 0.878, 1.0); // fffde0
    vec4 mid = vec4(0.808, 0.616, 0.325, 1.0);
    vec4 dark = vec4(0.161, 0.102, 0.0, 1.0); // ce9d53
    // vec4 darkOrange = vec4(0.427, 0.133, 0.0, 0.0);
    // vec4 darkerOrange = vec4(0.137, 0.076, 0.032, 0.0);
    vec4 black = vec4(0.0, 0.0, 0.0, 0.0);
    
    // calculate the color based on the distance from the y-axis
    float percentage;
    if (position.y != 0.0) {
      percentage = clamp(abs(position.y) / maxY, 0.0, 1.0);
    }
    else {
      percentage = 0.0;
    }
    
    // Randomize:
    percentage += fract(sin(percentage) * 10000.0) * 0.1;
    
    vColor = mix(bright, dark, percentage);
    // vColor = mix(mix(bright, dark, percentage), darkerOrange, 0.3);
  }
`;

// -- Fragment shader ------------------------------------------- //

// language=glsl
const fragmentShader = `
  varying vec4 vColor;
  
  void main(void) {
    gl_FragColor = vColor;
  }
`;

// -- Exports --------------------------------------------------- //

export default {
  license,
  description,
  vertexShader,
  fragmentShader,
}
