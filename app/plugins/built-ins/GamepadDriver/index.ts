import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import { guessGamepadName } from './types/gamepadNames';

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

  constructor() {
    this._timestamps = [ 0, 0, 0, 0 ];
    this._allNull = true;
    this._axisCache = [ [], [], [], [] ];
    this._buttonCache = [ [], [], [], [] ];
    window.addEventListener("gamepadconnected", this.onGamepadConnected.bind(this));
    window.addEventListener("gamepaddisconnected", this.onGamepadDisconnected.bind(this));

    const core = gameRuntime.tracked.core.cachedValue;
    core.onAnimateDone.getEveryChange(this.step.bind(this));
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
      const axis = axes[i];
      if (axisCache[i] !== axis) {
        axisCache[i] = axis;
        console.log(`[] axis ${i} changed to`, axis);
      }
    }

    // Propagate all button changes.
    for (let i = 0, len = buttons.length; i < len; i++) {
      const button = buttons[i];
      if (buttonCache[i] !== button.value) {
        buttonCache[i] = button.value;
        console.log(`[] button ${i} changed to`, button.value);
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
