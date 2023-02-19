When creating models, assuming your model is square, at a size of 1 square
it will take up 100% of the screen on a 1:1 resolution (it'll still have some
padding). The back of the model should point to Y in Blender (i.e. point to -Z
in three.js).

Note that these models are not rendered orthographically, so placing them away
from the origin will change their size drastically.
