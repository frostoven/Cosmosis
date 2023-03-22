type onGetSignature = (
  data: { originalGet: any, reference: { value: any, originalName: string } },
) => boolean | void;

type onSetSignature = (
  data: { originalSet: any, reference: { value: any, originalName: string } },
  newValue: any,
) => boolean | void;

export default class Hijacker {
  private _target: any;
  private _descriptorBackup: any;
  private _targetIsInstance: boolean;

  constructor(target: any = null, hijackPrototype = false) {
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
  override(
    propertyName: string,
    onGet: onGetSignature = () => {},
    onSet: onSetSignature = () => {},
  ) {
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

    const reference = {
      originalName: propertyName,
      value: this._target[propertyName],
    };

    if (onGet) {
      const originalGet = this._descriptorBackup?.get;
      const meta = { originalGet, reference };
      property.get = () => {
        let disableAutoGet = onGet(meta) === false;
        if (!disableAutoGet && typeof originalGet === 'function') {
            // This is done in case the original getter has some special logic
            // that needs to run.
            originalGet();
        }
        return reference.value;
      };
    }

    if (onSet) {
      const originalSet = this._descriptorBackup?.set;
      const meta = { originalSet, reference };
      property.set = (newValue) => {
        let disableAutoSet = onSet(meta, newValue) === false;
        if (!disableAutoSet) {
          if (typeof originalSet === 'function') {
            originalSet(newValue);
          }
          reference.value = newValue;
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
