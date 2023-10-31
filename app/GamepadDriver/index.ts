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

type GamepadCallback =
  | (() => void)
  | ((data: { key: string, value: number }) => void);

interface GamepadOptions {
  onAxisChange?: (() => void) | ((data: {
    key: string,
    value: number
  }) => void),
  onButtonChange?: (() => void) | ((data: {
    key: string,
    value: number
  }) => void)
}

/**
 * Offers a high-level interface for dealing with the gamepad. For performance
 * and timing reasons, you need to manually call step in a loop such as
 * requestAnimationFrame.
 * @class
 */
export default class GamepadDriver {
  public onAxisChange: GamepadCallback;
  public onButtonChange: GamepadCallback;

  // gamepadconnected events are inconsistent as they rely on accidentally
  // loading this class before the user can press a button. This array helps
  // keep track of what's been initialised so that we can detect late
  // instantiation.
  private static _initialised = [ false, false, false, false ];

  // Checks if anything has changed for a particular controller.
  private _timestamps: Array<number> = [ 0, 0, 0, 0 ];
  private _axisCache: Array<Array<string>> = [ [], [], [], [] ];
  private _buttonCache: Array<Array<string>> = [ [], [], [], [] ];
  private static _axisNames: Array<Array<string>> = [ [], [], [], [] ];
  private static _buttonNames: Array<Array<string>> = [ [], [], [], [] ];

  constructor({
    onAxisChange = () => {
    },
    onButtonChange = () => {
    },
  }: GamepadOptions) {
    this.onAxisChange = onAxisChange;
    this.onButtonChange = onButtonChange;

    window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
  }

  _initGamepad(gamepad: Gamepad) {
    GamepadDriver._initialised[gamepad.index] = true;

    const name = guessGamepadName(gamepad.id);
    const deviceType = guessControllerType(gamepad.id);

    GamepadDriver._axisNames[gamepad.index] = inputNames[deviceType][AXIS_INDEX];
    GamepadDriver._buttonNames[gamepad.index] = inputNames[deviceType][BUTTON_INDEX];

    console.log(`[GamepadDriver] Connected ${name} | treating as: ${ControllerType[deviceType]}`);
  }

  onGamepadConnected(event: GamepadEvent) {
    const gamepad = event.gamepad;
    this._initGamepad(gamepad);
  }

  onGamepadDisconnected(event: GamepadEvent) {
    const name = guessGamepadName(event.gamepad.id);
    console.log(`[GamepadDriver] Disconnected ${name}.`);

    const controllers = navigator.getGamepads();
    for (let i = 0, len = controllers.length; i < len; i++) {
      if (controllers[i] !== null) {
        return;
      }
    }
    // TODO: consider adding hooks in the application that reset certain states
    //  (such as thrust) if a controller is unplugged. The reason here being
    //  that a slider, for example, sets different state to a keyboard, meaning
    //  that stale state will remain from the slider until something else
    //  explicitly resets its state.
    console.log('[GamepadDriver] Nothing else connected; stopping all processing.');
  }

  // Button and axes checked by InputManager are rather expensive. This
  // function only propagates actual changes.
  checkAndTriggerChanges({ index, axes, buttons }) {
    const axisCache = this._axisCache[index];
    const buttonCache = this._buttonCache[index];
    const axisNames = GamepadDriver._axisNames[index];
    const buttonNames = GamepadDriver._buttonNames[index];

    // Propagate all axis changes.
    for (let i = 0, len = axes.length; i < len; i++) {
      const axisValue = axes[i];
      if (axisCache[i] !== axisValue) {
        axisCache[i] = axisValue;
        // console.log(`[input] axis '${axisNames[i]}' changed to`, axisValue);
        this.onAxisChange({ key: axisNames[i], value: axisValue });
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
        this.onButtonChange({ key: buttonNames[i], value: buttonValue });
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
      if (!GamepadDriver._initialised[i]) {
        this._initGamepad(controller);
      }
      this._timestamps[i] = controller.timestamp;
      this.checkAndTriggerChanges(controller);
    }
  }
}
