// language=glsl
const vertex =`
  uniform sampler2D texture1;
  uniform vec3 lookTarget;
  uniform mat4 modelMatrixInverse;
  
  uniform float rotation;
  uniform vec2 center;

  attribute vec3 aPosition;

  varying vec2 vUv;
  varying float distToCamera;

  float lengthSq(vec3 vector) {
    return vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
  }

  float findAngle(vec3 v1, vec3 v2) {
    return acos(
      dot(
        normalize(v1), normalize(v2)
      )
    );
  }

  vec3 rotate(vec4 quaternion, vec3 position) {
    vec3 temp = cross(quaternion.xyz, position) + quaternion.w * position;
    vec3 rotated = position + 2.0 * cross(quaternion.xyz, temp);
    return rotated;
  }

  void main() {

    vUv = uv;

    vec4 mvPosition = viewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    vec2 scale;
    scale.x = length(vec3(instanceMatrix[0].x, instanceMatrix[0].y, instanceMatrix[0].z));
    scale.y = length(vec3(instanceMatrix[1].x, instanceMatrix[1].y, instanceMatrix[1].z));

    vec2 alignedPosition = (position.xy - (center - vec2(0.5))) * scale;

    vec2 rotatedPosition;
    rotatedPosition.x = cos(rotation) * alignedPosition.x - sin(rotation) * alignedPosition.y;
    rotatedPosition.y = sin(rotation) * alignedPosition.x + cos(rotation) * alignedPosition.y;

    mvPosition.xy += rotatedPosition;

    gl_Position = projectionMatrix * mvPosition;

    // Get position relative to camera.
    vec4 modelViewPosition = modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
    vec4 newPosition = projectionMatrix * modelViewPosition;

    // Camera space position.
    vec4 csPosition = modelViewPosition * newPosition;
    distToCamera = distance(csPosition, newPosition);
  }
`;

// language=glsl
const fragment = `
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform float alphaTest;
  varying vec2 vUv;
  varying float distToCamera;
  
  #define fadeDist 0.05
  #define fadeReciprocal (1.0/fadeDist)
  #define fadeMultiplier 0.5

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
    
    vec4 color = vec4(0.0);
    
    //vec4 fColor = mix(color1, color2, vUv.y);
    //fColor.a = 1.0;
    // color = color1;
    // color = color = vec4(1.0, 0, 0, 1.0);
    color = mix(color1, color2, 0.5);
    color = mix(color, vec4(color.rgb, 0.0), 0.5);
    
    // Fade as we get closer
    vec4 invisible = vec4(vec3(color), 0.0);
    color = mix(invisible, color, opacity - 0.1);
    
    gl_FragColor = color;
  }
`;

const galaxyDust = {
  vertex,
  fragment,
};

export {
  galaxyDust
};
