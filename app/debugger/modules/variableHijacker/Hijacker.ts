export default class Hijacker {
  private _target: any;
  private _descriptorBackup: any;
  private _targetIsInstance: boolean;

  constructor(target = null, hijackPrototype = false) {
    this._target = null;
    this._descriptorBackup = null;
    this._targetIsInstance = true;

    if (target) {
      this.setParent(target, hijackPrototype);
    }
  }

  // The object we'll be digging our tentacles into.
  setParent(target: any, hijackPrototype = false) {
    if (hijackPrototype) {
      this._target = target.prototype;
    }
    else {
      this._target = target;
    }

    this._targetIsInstance = !hijackPrototype;
  }

  markAsPrototype(isPrototype = true) {
    this._targetIsInstance = !isPrototype;
  }

  isPrototype() {
    return !this._targetIsInstance;
  }

  // What to do if someone tries to read / alter the variable.
  // If the original property was a getter or setter, you will receive that
  // original as your first argument, followed by the actual passed arguments.
  // Return false from your callback to block the original get/set from being
  // called.
  override(propertyName: string, onGet: Function | null, onSet: Function | null) {
    if (this._target === null) {
      console.error(
        '[Hijacker] Define a target via setParent before overriding.'
      );
      return;
    }

    const property: { [key: string]: any } = {};

    const descriptor = this.dumpPropertyDescriptor(propertyName);
    if (descriptor) {
      this._descriptorBackup = { ...descriptor };
    }

    if (onGet) {
      property.get = (...args) => {
        const originalGet = this._descriptorBackup?.get;
        let stopExec = onGet({ originalGet }, ...args) === false;
        if (!stopExec && typeof originalGet === 'function') {
          // This is done in case the original getter has some write-related
          // stuff that needs to happen.
          originalGet();
        }
      };
    }

    if (onSet) {
      const originalSet = this._descriptorBackup?.set;
      property.set = (...args) => {
        let stopExec = onSet({ originalSet }, ...args) === false;
        if (!stopExec && typeof originalSet === 'function') {
          originalSet(...args);
        }
      };
    }

    Object.defineProperty(this._target, propertyName, property);
  }

  dumpPropertyDescriptor(propertyName: string) {
    if (this._target === null) {
      console.error(
        '[Hijacker] Cannot determine descriptor until target is set.'
      );
      return;
    }

    let descriptor;
    let target = this._target;
    if (this._targetIsInstance) {
      descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(target),
        propertyName
      );
    }
    else {
      descriptor = Object.getOwnPropertyDescriptor(
        target.prototype, propertyName
      );
    }

    return descriptor;
  }

  isGetterOrSetter(propertyName: string) {
    if (this._target === null) {
      console.error(
        '[Hijacker] Cannot determine descriptor until target is set.'
      );
      return;
    }

    const descriptor = this.dumpPropertyDescriptor(propertyName);

    if (!descriptor) {
      return false;
    }

    // @ts-ignore
    return !!(descriptor.get || descriptor.set);
  }
}

// @ts-ignore
window.$Hijacker = Hijacker;
