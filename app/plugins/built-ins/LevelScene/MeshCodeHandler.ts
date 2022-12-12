import AreaLight from './types/AreaLight';

// Dev note on module hooks: they're sometimes optional, sometimes required,
// and at other times implied. Which it is depends on the mesh code type. For
// example, fake lights could as well just be normal meshes, so the ship maker
// needs to explicitly indicate that it targets a lighting hook (of which there
// are various implementations [cockpit, external, etc.]. Switches however fall
// under level intractability, so are implied to be part of level
// intractability handlers.

export default class MeshCodeHandler {
  private _gltf: any;
  // Ship's hardware inventory. Inventory is grouped by the module handler that
  // should deal with it (unless that particular module has special
  // requirements).
  inventory: { [moduleHookName: string]: Array<any> };

  constructor(gltf) {
    this._gltf = gltf;
    this.inventory = {};
  }

  handle({ node, userData }) {
    const type = userData.type;
    if (type?.match(/[^a-zA-Z\d]/g)) {
      return console.error('[MeshCodeHandler] Types may not contain special characters.');
    }

    if (this[type]) {
      const handler = this[type].bind(this);
      handler({ node, userData });
    }
  }

  _targetModule(moduleName, objectData) {
    if (!this.inventory[moduleName]) {
      this.inventory[moduleName] = [];
    }
    this.inventory[moduleName].push(objectData);
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
    // visibility toggles lights in this case.
    light.visible = false;

    if (userData.moduleHook) {
      this._targetModule(userData.moduleHook, { node, userData });
    }
  }

  fakeLight({ node, userData }) {
    console.log('fake light:', node);
    if (!node.children) {
      console.warn('[MeshCodeHandler] Warning: could not process fake light:', node, userData);
      return;
    }

    const children = node.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      if (child.material) {
        // emissiveIntensity toggles lights in this case.
        child.material.emissiveIntensity = 0;

        if (userData.moduleHook) {
          this._targetModule(userData.moduleHook, { node, userData });
        }
      }
    }
  }
}
