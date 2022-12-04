import { AnimationClip, Camera, Scene } from 'three';

interface GLTFInterface {
  scene: Scene,
  animations: AnimationClip,
  asset: Object,
  cameras: Array<Camera>,
  // Actually a GLTFParser, but seems like a private class.
  parser: Function,
  scenes: Scene,
}

export {
  GLTFInterface,
}
