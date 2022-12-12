import AreaLight from './types/AreaLight';
import userProfile from '../../../userProfile';

export default class MeshCodeHandler {
  private _gltf: any;

  constructor(gltf) {
    this._gltf = gltf;
  }

  handle({ node, userData }) {
    const type = userData.type;
    if (this[type]) {
      const handler = this[type].bind(this);
      return handler({ node, userData });
    }
  }

  // TODO: Find a way of aligning with original object. It should be possible,
  //  but if it becomes a problem, we can add the property 'angle'; examples
  //  values: 'top-down', 'bottom-up', 'left to right', 'front to back', etc,
  //  or an angle number.
  areaLight({ node, userData }) {
    // TODO: remove this. It's a substitute for until we figure out how to deal
    //  with spaceship lifecycles. This disable non-hq lights entirely.
    if (userData.gfxqLight === 'low' || userData.gfxqLight === 'medium') {
      node.visible = false;
      return;
    }

    const light = new AreaLight(node, !!userData.devHelper).getLight();
    this._gltf.scene.add(light);
    node.attach(light);
    // We can use the 'visible' property to toggle lights.
    light.visible = false
  }
}
