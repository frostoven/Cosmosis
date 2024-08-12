import _ from 'lodash';
import { Object3D } from 'three';
import { MeshCodes } from '../interfaces/MeshCodes';
import AreaLight from './AreaLight';
import ZSpotlight from './ZSpotlight';
import ZPointLight from './ZPointLight';
import { lowercaseFirst } from '../../../../local/utils';

// Dev note on subsystems: they're sometimes optional, sometimes required,
// and at other times implied. Which it is depends on the mesh code type. For
// example, fake lights could as well just be normal meshes, so the ship maker
// needs to explicitly indicate that it targets a lighting hook (of which there
// are various implementations [cockpit, external, etc.]. Switches however fall
// under level intractability, so are implied to be part of level
// intractability handlers.
//
// TODO: figure out where to place HUD-specific things. For now, it's placed in
//  the VisorHud ship module code.

export default class MeshCodeHandler {
  private _gltf: any;
  // Ship's hardware inventory. Inventory is grouped by the module handler that
  // should deal with it (unless that particular module has special
  // requirements).
  inventory: { [subsystemName: string]: Array<any> };

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
    const type = userData.csmType;
    if (type?.match(/[^a-zA-Z\d]/g)) {
      return console.error('[MeshCodeHandler] Types may not contain special characters.');
    }

    if (type === 'csmUndefined') {
      // Quirk of the Blender plugin. It actually means 'not set'.
      return;
    }

    // To prevent conflicts with other add-ons, mesh codes in blender are
    // prefixed with 'csm'. Remove them here. This also means we only keep
    // entries that are explicitly related to Cosmosis.
    const abridgedUserData = {};
    _.each(userData, (entry, key) => {
      if (key.startsWith('csm')) {
        key = lowercaseFirst(key.substring(3));
        abridgedUserData[key] = entry;
      }
    });

    if (userData.typeId) {
      console.warn(
        '[MeshCodeHandler] The "typeId" field is reserved and will be ' +
        'replaced with an internal value; please consider removing it from ' +
        'your mesh.',
      );
    }

    if (this[type]) {
      const handler = this[type].bind(this);
      handler({ node, userData: abridgedUserData });
    }
  }

  _targetModule(moduleName, objectData) {
    if (!this.inventory[moduleName]) {
      this.inventory[moduleName] = [];
    }
    this.inventory[moduleName].push(objectData);
  }

  areaLight({ node, userData }) {
    userData.typeId = MeshCodes.areaLight;
    const useDevHelper = userData.devHelper === 'true';

    // TODO: remove this. It's a substitute for until we figure out how to deal
    //  with spaceship lifecycles. This disable non-hq lights entirely.
    if (userData.gfxqLight?.includes('low') || userData.gfxqLight?.includes('medium')) {
      node.visible = false;
      return;
    }

    const light = new AreaLight(node, useDevHelper).getLight();
    node.attach(light);
    // visibility toggles lights in this case.
    light.visible = false;

    if (userData.subsystem) {
      this._targetModule(userData.subsystem, { node: light, userData });
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
          switchableChildren.push(child);
        }
      }
    }
    if (userData.subsystem && switchableChildren.length) {
      this._targetModule(userData.subsystem, {
        node: switchableChildren,
        userData,
      });
    }
  }

  pointLight({ node, userData }) {
    userData.typeId = MeshCodes.pointLight;
    const useDevHelper = userData.devHelper === 'true';

    // TODO: remove this. It's a substitute for until we figure out how to deal
    //  with spaceship lifecycles. This disable non-hq lights entirely.
    if (userData.gfxqLight === 'low' || userData.gfxqLight === 'medium') {
      node.visible = false;
      return;
    }

    const light = new ZPointLight(node, useDevHelper).getLight();

    if (userData.subsystem) {
      this._targetModule(userData.subsystem, { node: light, userData });
    }
  }

  spotlight({ node, userData }) {
    userData.typeId = MeshCodes.spotlight;
    const useDevHelper = userData.devHelper === 'true';

    // TODO: remove this. It's a substitute for until we figure out how to deal
    //  with spaceship lifecycles. This disable non-hq lights entirely.
    if (userData.gfxqLight === 'low' || userData.gfxqLight === 'medium') {
      node.visible = false;
      return;
    }

    const light = new ZSpotlight(node, useDevHelper).getLight();

    if (userData.subsystem) {
      this._targetModule(userData.subsystem, { node: light, userData });
    }
  }
}
