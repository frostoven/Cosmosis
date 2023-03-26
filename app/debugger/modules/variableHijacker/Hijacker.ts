type onGetSignature = (
  data: { originalGet: any, valueStore: { value: any, originalName: string | null } },
) => boolean | void;

type onSetSignature = (
  data: { originalSet: any, valueStore: { value: any, originalName: string | null } },
  newValue: any,
) => boolean | void;

// Add to docs when writing:
// Beware of getters and setters on the target object. While the hijacker can
// grab those, it'll only be able to intercept requests that directly target
// those getters and setters. For example, if the getter is myVar but the class
// internally uses _myVar, then requests to read and write _myVar won't be
// noticed by the hijacker, while requests to read and write myVar will be
// intercepted successfully. This can result in inconsistent behaviour
// depending on your reason for hijacking the variable in the first place. On
// the other hand, this is also useful for cases where you specifically want to
// fool external code while keeping private vars clean. You can check if your
// target is a getter or setter using the isGetterOrSetter command built into
// this library's class.

export default class Hijacker {
  private _target: any;
  private _descriptorBackup: any;
  private _targetIsInstance: boolean;
  private readonly _valueStore: { originalName: string | null; value: any };

  constructor(target: any = null, hijackPrototype = false) {
    this._target = null;
    this._descriptorBackup = null;
    this._targetIsInstance = true;

    this._valueStore = {
      originalName: null,
      value: undefined,
    };

    if (target) {
      this.setParent(target, hijackPrototype);
    }
  }

  get valueStore() {
    return this._valueStore;
  }

  set valueStore(v) {
    const message = '[Hijacker] valueStore is read-only, though you may ' +
      'modify its children.';
    console.error(message);
    throw message;
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

      // Preserve instance context.
      if (typeof this._descriptorBackup.get === 'function') {
        this._descriptorBackup.get = this._descriptorBackup.get.bind(this._target);
      }
      if (typeof this._descriptorBackup.set === 'function') {
        this._descriptorBackup.set = this._descriptorBackup.set.bind(this._target);
      }
    }

    const valueStore = this._valueStore;
    valueStore.originalName = propertyName;
    valueStore.value = this._target[propertyName];

    if (onGet) {
      const originalGet = this._descriptorBackup?.get;
      const meta = { originalGet, valueStore };
      property.get = () => {
        let disableAutoGet = onGet(meta) === false;
        if (!disableAutoGet && typeof originalGet === 'function') {
            valueStore.value = originalGet();
        }
        return valueStore.value;
      };
    }

    if (onSet) {
      const originalSet = this._descriptorBackup?.set;
      const meta = { originalSet, valueStore };
      property.set = (newValue) => {
        let disableAutoSet = onSet(meta, newValue) === false;
        if (!disableAutoSet) {
          if (typeof originalSet === 'function') {
            originalSet(newValue);
          }
          valueStore.value = newValue;
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
