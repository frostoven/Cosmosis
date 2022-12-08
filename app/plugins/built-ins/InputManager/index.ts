import CosmosisPlugin from '../../types/CosmosisPlugin';
import ContextualInput from './types/ContextualInput';
import { gameRuntime } from '../../gameRuntime';

class InputManager {
  private readonly _registeredControllers: {};

  constructor() {
    this._registeredControllers = {};
      ContextualInput.registerMouseDriver(gameRuntime.tracked.mouseDriver.cachedValue);
      ContextualInput.initListeners();

      this._setupWatchers();
  }

  _setupWatchers() {
    gameRuntime.tracked.mouseDriver.getEveryChange((mouseDriver) => {
      ContextualInput.registerMouseDriver(mouseDriver);
    });
  }

  registerController(name) {
    const contextualInput = new ContextualInput(name);
    ContextualInput.activateInstances([ name ]);
    this._registeredControllers[name] = contextualInput;
  }
}

const inputManagerPlugin = new CosmosisPlugin('inputManager', InputManager);

export {
  InputManager,
  inputManagerPlugin,
}
