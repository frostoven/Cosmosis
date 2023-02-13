import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import { InputManager } from '../InputManager';
import { ControllerType, guessControllerType } from './types/ControllerType';
import { guessGamepadName } from './types/gamepadNames';

const { unknown, gamepad, hotas, flightStick, racingWheel } = ControllerType;

// --- Pre-generate button names ------------------------------------------- //

// In this section we pre-generate all possible button names, and then place
// them in arrays for easy access later. This is a performance improvement; on
// slow systems, dynamically generating strings hundreds of times a second is
// noticeably slower under worst-case scenario conditions, and can cause
// stutter. This method makes using customs strings for buttons extremely fast,
// because all we end up doing is referencing values by array index.
//
// The ultimate purpose here is being able to easily separate incompatible
// control bindings. For example, using an Xbox controller's bindings on a
// HOTAS is a terrible experience, because buttons and axes of the same names
// don't map logically (then there's the other issue that you wouldn't want a
// flight stick and control box to share bindings).

const AXIS_INDEX = 0;
const BUTTON_INDEX = 1;

const inputTypeCount = Object.values(ControllerType).length / 2;
const inputNames: Array<Array<Array<string>>> =
  new Array(inputTypeCount).fill(null).map(() => []);

const gamepadAxisNames: Array<string> = [];
const gamepadButtonNames: Array<string> = [];
inputNames[gamepad][AXIS_INDEX] = gamepadAxisNames;
inputNames[gamepad][BUTTON_INDEX] = gamepadButtonNames;
inputNames[unknown] = inputNames[gamepad];
//
const hotasAxisNames: Array<string> = [];
const hotasButtonNames: Array<string> = [];
inputNames[hotas][AXIS_INDEX] = hotasAxisNames;
inputNames[hotas][BUTTON_INDEX] = hotasButtonNames;
//
const flightStickAxisNames: Array<string> = [];
const flightStickButtonNames: Array<string> = [];
inputNames[flightStick][AXIS_INDEX] = flightStickAxisNames;
inputNames[flightStick][BUTTON_INDEX] = flightStickButtonNames;
//
const racerStickAxisNames: Array<string> = [];
const racerStickButtonNames: Array<string> = [];
inputNames[racingWheel][AXIS_INDEX] = racerStickAxisNames;
inputNames[racingWheel][BUTTON_INDEX] = racerStickButtonNames;

// TODO: maybe set these to -1 or something. The first time a button is
//  pressed, the gamepad will forcibly report a bunch of zeros and the one
//  button that's being pressed. If -1, and button value is zero, set to zero
//  and return. If 1, set and propagate.
// I couldn't find any controllers that support more than 32 bindings. If this
// turns out to be incorrect, we can increase the value.
for (let i = 0; i < 32; i++) {
  gamepadAxisNames.push(`ax${i}`);
  gamepadButtonNames.push(`bt${i}`);
  //
  hotasAxisNames.push(`ha${i}`);
  hotasButtonNames.push(`hb${i}`);
  //
  flightStickAxisNames.push(`fa${i}`);
  flightStickButtonNames.push(`fb${i}`);
  //
  racerStickAxisNames.push(`ra${i}`);
  racerStickButtonNames.push(`rb${i}`);
}

// --- Pre-gen section end ------------------------------------------------- //

// Note: this relates to how the mouse works with the game window. It has
// nothing to do with mounting rodents, though we may or may not have such
// implementation plans.
class GamepadDriver {
  // Checks if anything has changed for a particular controller.
  private readonly _timestamps: Array<number>;
  // Cached check of this.controllers. If true, controller data isn't checked
  // for updates at all.
  private _allNull: boolean;
  private readonly _axisCache: Array<Array<string>>;
  private readonly _buttonCache: Array<Array<string>>;
  private readonly _axisNames: Array<Array<string>>;
  private readonly _buttonNames: Array<Array<string>>;
  private _cachedInputManager: InputManager;

  constructor() {
    this._timestamps = [ 0, 0, 0, 0 ];
    this._allNull = true;
    this._axisCache = [ [], [], [], [] ];
    this._buttonCache = [ [], [], [], [] ];
    this._axisNames = [ [], [], [], [] ];
    this._buttonNames = [ [], [], [], [] ];

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
    const gamepad = event.gamepad;
    const name = guessGamepadName(gamepad.id);
    const deviceType = guessControllerType(gamepad.id);

    this._axisNames[gamepad.index] = inputNames[deviceType][AXIS_INDEX];
    this._buttonNames[gamepad.index] = inputNames[deviceType][BUTTON_INDEX];

    console.log(`[GamepadDriver] Connected ${name} | treating as: ${ControllerType[deviceType]}`);
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
    const axisNames = this._axisNames[index];
    const buttonNames = this._buttonNames[index];

    // Propagate all axis changes.
    for (let i = 0, len = axes.length; i < len; i++) {
      const axisValue = axes[i];
      if (axisCache[i] !== axisValue) {
        axisCache[i] = axisValue;
        // console.log(`[input] axis '${axisNames[i]}' changed to`, axisValue);
        this._cachedInputManager.propagateInput({ key: axisNames[i], value: axisValue });
      }
    }

    // Propagate all button changes.
    for (let i = 0, len = buttons.length; i < len; i++) {
      const buttonValue = buttons[i].value;
      if (buttonCache[i] !== buttonValue) {
        buttonCache[i] = buttonValue;
        // console.log(`[input] button ${buttonNames[i]} changed to`, buttonValue);
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
