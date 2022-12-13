import { Object3D } from 'three';
import AreaLight from './AreaLight';
import { MeshCodes } from '../interfaces/MeshCodes';

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

  // Between Blender and Three.js, they're smart enough to reuse the same
  // material on different meshes. This means that we don't need to loop
  // through every single mesh when disabling fake lights; we can simply alter
  // the mesh and the rest will follow suit. This object keeps track of fake
  // light materials we've already placed in inventory to avoid saving the same
  // material twice.
  private readonly _savedMaterials: {};

  constructor(gltf) {
    this._gltf = gltf;
    this.inventory = {};
    this._savedMaterials = {};
  }

  handle({ node, userData }) {
    const type = userData.type;
    if (type?.match(/[^a-zA-Z\d]/g)) {
      return console.error('[MeshCodeHandler] Types may not contain special characters.');
    }
    if (userData.typeId) {
      console.warn(
        '[MeshCodeHandler] The "typeId" field is reserved and will be ' +
        'replaced with an internal value; please consider removing it from ' +
        'your mesh.'
      );
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
    userData.typeId = MeshCodes.areaLight;

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
      this._targetModule(userData.moduleHook, { node: light, userData });
    }
  }

  fakeLight({ node, userData }) {
    userData.typeId = MeshCodes.fakeLight;

    if (!node.children) {
      console.warn('[MeshCodeHandler] Warning: could not process fake light:', node, userData);
      return;
    }

    const switchableChildren: Array<Object3D> = [];

    const children = node.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      if (child.material) {
        if (this._savedMaterials[child.material.uuid]) {
          // We've already stored this material. Skip it.
          continue;
        }
        else {
          this._savedMaterials[child.material.uuid] = true;
        }

        if (child.material.emissiveIntensity) {
          // emissiveIntensity toggles lights in this case.
          child.material.emissiveIntensity = 0;
          console.log('===> Emissive material:', child.material);
          switchableChildren.push(child);
        }
      }
    }
    if (userData.moduleHook && switchableChildren.length) {
      this._targetModule(userData.moduleHook, { node: switchableChildren, userData });
    }
  }
}

console.log({ MeshCodeHandler });
