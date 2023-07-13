const vertex = /* glsl */`
  uniform sampler2D texture1; 
  
  varying vec2 vUv;
  varying float distToCamera;
  
  void main() {

    vUv = uv;
    
    vec4 mvPosition = vec4( position, 1.0 );
    // #ifdef USE_INSTANCING
      mvPosition = instanceMatrix * mvPosition;
    // #endif

    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    
    gl_Position = projectionMatrix * modelViewPosition;
    
    // Camera space position.
    vec4 cs_position = modelViewPosition * gl_Position;
    distToCamera = distance(cs_position, gl_Position);
  }
`;

const fragment = /* glsl */`
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform float alphaTest;
  varying vec2 vUv;
  varying float distToCamera;
  
  #define fadeDist 0.05
  #define fadeReciprocal (1.0/fadeDist)
  #define fadeMultiplier 0.5

  out vec4 fragColor;
  void main() {
    vec4 color1 = texture2D(texture1, vUv);
    vec4 color2 = texture2D(texture2, vUv);
    
    if (color1.a < alphaTest && color2.a < alphaTest) {
      discard;
    }
   
    float opacity = 1.0;
    if (distToCamera < fadeDist) {
      opacity = (distToCamera / fadeDist);
      opacity *= opacity * opacity * opacity;
    }
    
    //vec4 fColor = mix(color1, color2, vUv.y);
    //fColor.a = 1.0;
    // fragColor = color1;
    // fragColor = fragColor = vec4(1.0, 0, 0, 1.0);
    fragColor = mix(color1, color2, 0.5);
    fragColor = mix(fragColor, vec4(fragColor.rgb, 0.0), 0.5);
    
    // Fade as we get closer
    vec4 invisible = vec4(vec3(fragColor), 0.0);
    fragColor = mix(invisible, fragColor, opacity - 0.1);
  }
`;

const galaxyDust = {
  vertex,
  fragment,
};

export {
  galaxyDust
};
