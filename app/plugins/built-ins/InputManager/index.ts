import CosmosisPlugin from '../../types/CosmosisPlugin';
import ContextualInput from './types/ContextualInput';

class InputManager {
  private readonly _registeredControllers: {};

  constructor() {
    this._registeredControllers = {};
    ContextualInput.initListeners();
  }

  registerController(name) {
    const contextualInput = new ContextualInput(name);
    ContextualInput.activateInstances([ name ]);
    this._registeredControllers[name] = contextualInput;
  }
}

const inputManagerPlugin = new CosmosisPlugin('inputManager', InputManager);

export {
  inputManagerPlugin,
}
