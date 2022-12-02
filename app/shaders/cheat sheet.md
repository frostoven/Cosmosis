### Intro
This doc contains frequently-used GLSL ES functions found in Cosmosis shaders.

This doc is still under construction.

### Pitfalls

#### Note on GL points
_Avoid using GL points for anything that requires accuracy or visual
consistency_. GL points have a rather poor spec and are thus rendered
differently per vendor. In fact, visuals will sometimes differ on even the same
graphics card using different device drivers.

GL points also suffer from the problem that their size is
screen-resolution-dependent. This means that, if size matters (hint: if she
says it doesn't, she's lying), you need to constantly check for game resizes
and send these to the shader, which in turn needs to be written to dynamically
change point size according to said resizes.

### Vertex shader
tba

### Fragment shader

#### Built-in variables

| Variable | Description |
| ---------| ----------- |
| `gl_FragColor` | **vec4 • mediump** The colour your pixel will ultimately become. |
| `gl_FragCoord` | **vec4 • mediump [Read-only]** Holds the window relative coordinates `x`, `y`, `z` and `1/w` values for the fragment. `z` is the fragment's depth. |
| `gl_FragData[gl_MaxDrawBuffers]` | **vec4 • mediump** *(Needs research)* |
| `gl_FrontFacing` | **bool [Read-only]** True if the fragment belongs to a front-facing primitive. One use-case is to emulate two-sided lighting by selecting one of two colours calculated by the vertex shader. |
| `gl_PointCoord` | **vec2 • mediump [Read-only]** Two-dimensional coordinates indicating where within a point primitive the current fragment is located. They range from `0.0` to `1.0`. If the current primitive is not a point, then its values are undefined. |

#### Keywords

| Keyword | Description |
| ---------| ----------- |
| discard | Discards the fragment (in other words, does not write any colour data). Useful when used in conjunction with alpha tests. |

<!--
TODO: add notes on uniform, varying, attribute, and the Three.js #include directive.
-->
