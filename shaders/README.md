All game shaders are placed in this directory.

Only `.vert` and `.frag` files are loaded; all other extensions are ignored.

Shader language used: GLSL ES2.

Usage:
```js
import getShader from './shaders';
const shader = getShader('shaderName');
console.log(shader);
// { vertex: '...', fragment: '...' }
```

References:
 * https://www.khronos.org/files/opengles_shading_language.pdf
 * https://www.khronos.org/opengl/wiki/Shader
 * https://www.khronos.org/opengl/wiki/Vertex_Shader
 * https://www.khronos.org/opengl/wiki/Fragment_Shader
