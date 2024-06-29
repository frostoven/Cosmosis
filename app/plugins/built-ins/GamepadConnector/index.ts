import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import { InputManager } from '../InputManager';
import Modal from '../../../modal/Modal';
import GamepadDriver from '../../../GamepadDriver';
import { logBootTitleAndInfo } from '../../../local/windowLoadListener';
import PluginLoader from '../../types/PluginLoader';

class GamepadConnector {
  private _driver!: GamepadDriver;
  private _cachedInputManager: InputManager;

  constructor() {
    logBootTitleAndInfo('Driver', 'Enhanced Analog Control', PluginLoader.bootLogIndex);
    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;
    this._setupWatchers();
  }

  _setupWatchers() {
    gameRuntime.tracked.core.getEveryChange((core) => {
      core.onPreAnimate.getEveryChange(this.step.bind(this));
    });
    gameRuntime.tracked.inputManager.getEveryChange((inputManager) => {
      this._cachedInputManager = inputManager;
      this._driver = new GamepadDriver({
        onAxisChange: this.propagateInput.bind(this),
        onButtonChange: this.propagateInput.bind(this),
      });
    });
  }

  propagateInput(data: { key: string, value: number }) {
    if (Modal.allowExternalListeners) {
      this._cachedInputManager.propagateInput(data);
    }
  }

  step() {
    if (this._driver) {
      this._driver.step();
    }
  }
}

const gamepadConnectorPlugin = new CosmosisPlugin('gamepadConnector', GamepadConnector);

export {
  GamepadConnector,
  gamepadConnectorPlugin,
}
