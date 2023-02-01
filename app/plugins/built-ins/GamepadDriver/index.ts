import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import { guessGamepadName } from './types/gamepadNames';
import { InputManager } from '../InputManager';

const axisNames: Array<string> = [];
const buttonNames: Array<string> = [];

for (let i = 0; i < 32; i++) {
  axisNames.push(`ax${i}`);
  buttonNames.push(`bt${i}`);
}

// Note: this relates to how the mouse works with the game window. It has
// nothing to do with mounting rodents, though we may or may not have such
// implementation plans.
class GamepadDriver {
  // Checks if anything has changed for a particular controller.
  private readonly _timestamps: Array<number>;
  // Cached check of this.controllers. If true, controller data isn't checked
  // for updates at all.
  private _allNull: boolean;
  private readonly _axisCache: any[][];
  private readonly _buttonCache: any[][];
  private _cachedInputManager: InputManager;

  constructor() {
    this._timestamps = [ 0, 0, 0, 0 ];
    this._allNull = true;
    this._axisCache = [ [], [], [], [] ];
    this._buttonCache = [ [], [], [], [] ];

    window.addEventListener("gamepadconnected", this.onGamepadConnected.bind(this));
    window.addEventListener("gamepaddisconnected", this.onGamepadDisconnected.bind(this));

    this._cachedInputManager = gameRuntime.tracked.inputManager.cachedValue;
    this._setupWatchers();
  }

  _setupWatchers() {
    gameRuntime.tracked.core.getEveryChange((core) => {
      core.onPreAnimate.getEveryChange(this.step.bind(this));
    });
    gameRuntime.tracked.inputManager.getEveryChange((inputManager) => {
      this._cachedInputManager = inputManager;
    });
  }

  onGamepadConnected(event: GamepadEvent) {
    const name = guessGamepadName(event.gamepad.id);
    console.log(`[GamepadDriver] Connected ${name}.`);
    this._allNull = false;
  }

  onGamepadDisconnected(event: GamepadEvent) {
    const name = guessGamepadName(event.gamepad.id);
    console.log(`[GamepadDriver] Disconnected ${name}.`);

    const controllers = navigator.getGamepads();
    for (let i = 0, len = controllers.length; i < len; i++) {
      if (controllers[i] !== null) {
        this._allNull = false;
        return;
      }
    }
    this._allNull = true;
    console.log('[GamepadDriver] Nothing else connected; stopping all processing.');
  }

  // Button and axes checked by InputManager are rather expensive. This
  // function only propagates actual changes.
  checkAndTriggerChanges({ index, axes, buttons }) {
    const axisCache = this._axisCache[index];
    const buttonCache = this._buttonCache[index];
    // console.log(`-> controller ${index}: [${this._timestamps[index]}]`, buttons);

    // Propagate all axis changes.
    for (let i = 0, len = axes.length; i < len; i++) {
      const axisValue = axes[i];
      if (axisCache[i] !== axisValue) {
        axisCache[i] = axisValue;
        // console.log(`[] axis ${i} changed to`, axisValue);
        this._cachedInputManager.propagateInput({ key: axisNames[i], value: axisValue });
      }
    }

    // Propagate all button changes.
    for (let i = 0, len = buttons.length; i < len; i++) {
      const buttonValue = buttons[i].value;
      if (buttonCache[i] !== buttonValue) {
        buttonCache[i] = buttonValue;
        console.log(`[] button ${i} changed to`, buttonValue);
        // TODO: use `bt` for Xbox, Sony, and generic controllers. For others,
        //  use names that resemble the type or brand. For example, maybe name
        //  flight stick buttons `fl` and HOTAS switches `ht`. This allows
        //  using similar controllers interchangeably while insuring that
        //  vastly different controllers don't steal keybindings not belonging
        //  to them. If unknown, default to bt. Don't do this for axes.
        this._cachedInputManager.propagateInput({ key: buttonNames[i], value: buttonValue });
      }
    }
  }

  step() {
    const gamepads = navigator.getGamepads();
    for (let i = 0, len = gamepads.length; i < len; i++) {
      const controller = gamepads[i];
      if (!controller || controller.timestamp <= this._timestamps[i]) {
        continue;
      }
      this._timestamps[i] = controller.timestamp;
      this.checkAndTriggerChanges(controller);
    }
  }
}

const gamepadDriverPlugin = new CosmosisPlugin('gamepadDriver', GamepadDriver);

export {
  GamepadDriver,
  gamepadDriverPlugin,
}
