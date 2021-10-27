export default function LogicalSceneGroup(options={}) {
  this.activate = this.deactivate = this.render = () => {};
  this._allScenes = {};
  this._allActionControllers = {};
  this._cachedRenderHooks = [];

  const defaultFn = () => {};

  options.activate && (this.activate = options.activate || defaultFn);
  options.deactivate && (this.deactivate = options.deactivate || defaultFn);
  options.render && (this.render = options.render || defaultFn);
  options.step && (this.step = options.step || defaultFn);
}

/**
 * @type {{activate, render, deactivate}}
 */
LogicalSceneGroup.prototype = {
  get active() { return this._active; },
  set active(invalid) {
    throw 'LogicalSceneGroup\'s "active" property is read-only; set using ' +
    '"activate()" and "deactivate()" instead.';
  },

  // Should be called whenever this LSG is prepped for render.
  get activate() { return this._activate; },
  set activate(fn) {
    this._activate = function protoActivate() {
      this._active = true;
      fn.apply(null, arguments);
    }
  },

  // Should be called whenever this LSG should no longer be rendered.
  get deactivate() { return this._deactivate; },
  set deactivate(fn) {
    this._deactivate = function protoDeactivate() {
      this._active = false;
      fn.apply(null, arguments);
    }
  },

  // Called during animation loop when this LSG is active.
  get render() { return this._render; },
  set render(fn) { this._render = fn; },

  // Called every frame, regardless of whether or not his LSG is active.
  get step() { return this._step; },
  set step(fn) { this._step = fn; },
};

/**
 * Registers a scene. Requires sceneInfo object.
 */
LogicalSceneGroup.prototype.registerScene = function registerScene(sceneInfo={}) {
  let errors = 0;
  if (!sceneInfo.name) {
    console.error('Error: registerScene requires a name.');
    errors++;
  }
  if (!sceneInfo.init) {
    console.error('Error: registerScene requires an init function.');
    errors++;
  }
  if (this._allScenes[sceneInfo.name]) {
    console.error(
      `Error: attempted to registering scene ${sceneInfo.name} twice. This ` +
      'is likely a bug.'
    );
    errors++;
  }
  if (errors > 0) {
    return;
  }

  this._allScenes[sceneInfo.name] = sceneInfo;
}

// TODO: this appears to be duplicate naming (action is currently used by modes
//  to mean high-level input). Perhaps rename this project-wide to modeInfo
//  instead.
LogicalSceneGroup.prototype.registerRenderHook = function registerRenderHook(actionInfo={}) {
  let errors = 0;
  if (!actionInfo.name) {
    console.error('Error: registerScene requires a name.');
    errors++;
  }
  if (!actionInfo.render) {
    console.error('Error: registerScene requires a render function.');
    errors++;
  }
  if (this._allScenes[actionInfo.name]) {
    console.error(
      `Error: attempted to registering scene ${actionInfo.name} twice. This ` +
      'is likely a bug.'
    );
    errors++;
  }
  if (errors > 0) {
    return;
  }

  this._allActionControllers[actionInfo.name] = actionInfo;
  this._cachedRenderHooks.push(actionInfo);
}
