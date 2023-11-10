import _ from 'lodash';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import Modal from '../../../modal/Modal';
import { ModeId } from './types/ModeId';
import { MouseDriver } from '../MouseDriver';
import { gameRuntime } from '../../gameRuntime';
import { AnalogSource } from './types/AnalogSource';
import ModeController from './types/ModeController';
import { CoreType } from '../Core';
import { InputSchemeEntry } from './interfaces/InputSchemeEntry';
import { MouseButtonName } from '../../../configs/types/MouseButtonName';

/*
 * Mechanism:
 * Controllers register themselves. The registration puts them inside a mode.
 * (Note that freeCam and shipPilot are two controllers in a single mode:
 * playerControl. Menu and app are different modes running at the same time as
 * playerControl).
 * The new controller is placed inside the requested mode. That mode may be
 * activated by enum ID. Whenever a new key is propagated out, modes are
 * iterated in ModeID enum key order (which may be also thought of as
 * explicitly defining priority). In order of priority, the first mode to want
 * a key, gets that key.
 */

// Nomenclature:
// Mode: a logical group of controllers.
// Controller: something capable of responding to key input.
class InputManager {
  // Can be used to test key processing latency. At time the of wiring, takes
  // less than 0.1ms (0.0001 seconds) under medium load, and immeasurably small
  // (reported as 0ms) under low load, to reach the end of receiveAsKbButton.
  // receiveAsKbButton is pretty much the last step in the processing queue.
  // Unconscious human reflexes sit at around 80ms (0.08 seconds), so our
  // performance is acceptable.
  public static lastPressTime = -1;

  private _blockAllInput: boolean;
  private _blockKbMouse: boolean;

  private readonly _modes: Array<{ [key: string]: ModeController }>;
  private readonly _activeControllers: Array<string>;
  private readonly _allControllers: {};
  private _mouseDriver: MouseDriver;
  public allowBubbling: boolean;

  private _cachedCore: CoreType;

  private readonly _heldButtons: { [key: string]: boolean };
  private _prevMouseX: number;
  private _prevMouseY: number;
  private _prevControllerX: number;
  private _prevControllerY: number;

  /**
   * This allows plugins to make their control bindings known without the need
   * to be activated first (useful for things like the control bindings menu).
   * Plugins may use this simply by storing their controls in here when their
   * constructors run. Use it like so:
   *
   * @example
   * InputManager.allControlSchemes.yourControlSchema = {
   *   schema: yourControlSchema,
   *   friendly: 'Name You Want Displayed',
   * };
   */
  public static allControlSchemes: Record<string, InputSchemeEntry> = {};

  /** Contains reverse-lookup details of key bindings. */
  public static allKeyLookups: Record<string, Object> = {};

  /**
   * Returns InputManager.allControlSchemes, ordered by priority, descending.
   * @return InputSchemeEntry
   */
  public static getControlSchemes = (): InputSchemeEntry[] => {
    return _.orderBy(
      InputManager.allControlSchemes,
      (entry: InputSchemeEntry,) => entry.priority || 0,
      [ 'desc' ],
    ) as InputSchemeEntry[];
  };

  constructor() {
    this._blockAllInput = false;
    this._blockKbMouse = false;

    // Note: we divide by 2 because TS generates both an index and a key name
    // for each entry.
    const modeCount = Object.keys(ModeId).length / 2;
    this._modes = [];
    for (let i = 0; i < modeCount; i++) {
      this._modes.push({});
    }

    this._activeControllers = [
      // Indices 0-4 indicates the mode ID. Each string at that index indicates
      // the active controller.
      // E.g.: playerControl === 1; _activeControllers[1] === 'freeCam';
      'default', 'default', 'default', 'default',
    ];

    // Contains literally all controllers, both inclusive and mutually
    // exclusive.
    this._allControllers = {};

    this._mouseDriver = gameRuntime.tracked.mouseDriver.cachedValue;
    this.allowBubbling = false;

    this._heldButtons = {};
    this._prevMouseX = 0;
    this._prevMouseY = 0;
    this._prevControllerX = 0;
    this._prevControllerY = 0;

    this._cachedCore = gameRuntime.tracked.core.cachedValue;
    this._cachedCore.onAnimate.getEveryChange(this.stepActiveControllers.bind(this));

    this._setupWatchers();
    this._setupInputListeners();
  }

  _setupWatchers() {
    gameRuntime.tracked.core.getEveryChange((core) => {
      this._cachedCore = core;
    });
    gameRuntime.tracked.mouseDriver.getEveryChange((mouseDriver) => {
      this._mouseDriver = mouseDriver;
    });
  }

  _setupInputListeners() {
    const listener = this._kbMouseEventListener.bind(this);
    window.addEventListener('keydown', listener);
    window.addEventListener('keyup', listener);
    window.addEventListener('mousedown', listener, false);
    window.addEventListener('mouseup', listener, false);
    // Note: we can add { passive: false } in future if we want to preventDefault
    // in scrolling.
    window.addEventListener('wheel', listener, false);
    window.addEventListener('mousemove', listener, false);
    window.addEventListener('pointerlockchange', listener, false);
  }

  // TODO: this method (and several others) were copy-pasted from previous
  //  very quick-and-dirty code that became important. It needs cleanup.
  _kbMouseEventListener(event) {
      // Input manager is subservient to the modal system. Give up if active,
      // or if something has requested inputs be disabled.
    // if (this._blockKbMouse || Modal.modalActive) {
    if (this._blockKbMouse || !Modal.allowExternalListeners) {
      return;
    }

    InputManager.lastPressTime = performance.now();

    // Note: code is retained for keyboard events, but modified for other event
    // types. For example, mouse click left will be stored as code=spMouseLeft
    // (sp is short for 'special').
    let key = event.code;
    const type = event.type;

    // Stop the browser messing with anything game related. This prevents bugs
    // like arrows unintentionally scrolling the page. Bubbling is generally
    // only enabled when a dialog with an input field takes priority. Wheel
    // throws error unless passive is set (which currently is unhelpful) so we
    // skip wheel.
    if (!this.allowBubbling && type !== 'wheel') {
      // We need to check if truthy because pointerLock doesn't implement
      // preventDefault.
      // TODO: this has the shitty side-effect of disabling text selection.
      //  We *do* need code though because it prevents default behaviour that
      //  causes many other bugs. Maybe see if you can detect if the target is
      //  modal etc, and don't prevent in this cases. REPORT AS BUG.
      if (event.preventDefault) {
        event.preventDefault();
      }
    }

    // 0 = not being pressed, 1 = currently being pressed.
    let value = 1;
    // If true, a button will never signal a key up. This is a requirement for
    // mouse wheel scrolls.
    let isNeverHeld = false;
    // This never trigger key up signals and are handled separately.
    let analogData;

    switch (type) {
      case 'keypress':
      case 'click':
      // Don't use built-in presses as they don't fire for all possible keys.
      // https://developer.mozilla.org/en-US/docs/Web/API/Document/keydown_event
      // Luckily, manually dealing with keypresses are easy anyway.
        break;
      case 'mousemove':
        if (!this._mouseDriver.isPointerLocked) {
          // Ignore mouse if pointer is being used by menu or HUD.
          return;
        }
        analogData = this.calculateAnalogData(
          event.movementX, event.movementY, AnalogSource.mouse,
        );
        break;
      case 'mousedown':
        key = MouseButtonName[event.button];
        break;
      case 'mouseup':
        key = MouseButtonName[event.button];
      // Note: fallthrough is intentional here.
      case 'keyup':
        value = 0;
        break;
      case 'wheel':
        // Note: a wheel scroll is always classed as a press.
        isNeverHeld = true;
        key = this.keyFromWheelDelta(event.deltaY);
        if (!key) {
          // TODO: check if returning out after zero is bad thing. Maybe we need it for resets.
          return;
        }
        break;
    }

    if (analogData) {
      // Analog events very little bureaucracy involved. Simply trigger for each
      // axis and call it a day.
      const xData = analogData.x;
      const yData = analogData.y;
      this.propagateInput({
        key: xData.key,
        value,
        analogData: { delta: xData.delta, gravDelta: xData.gravDelta, complement: xData.complement },
      });
      this.propagateInput({
        key: yData.key,
        value,
        analogData: { delta: yData.delta, gravDelta: yData.gravDelta, complement: yData.complement },
      });
    }
    else {
      // All other kinds of events covered in this block.
      if (!isNeverHeld) {
        // Prevent event spam by keeping track of which buttons are currently held
        // down.
        if (value === 0) {
          this._heldButtons[key] = false;
          // delete heldButtons[key];
        }
        else {
          if (this._heldButtons[key]) {
            return;
          }
          this._heldButtons[key] = true;
        }
      }

      this.propagateInput({ key, value });

      // Immediately trigger a button release for buttons that cannot be held (such
      // as scroll wheels).
      if (isNeverHeld) {
        this.propagateInput({ key: key, value: 0 });
      }
    }
  }

  blockAllInput(enabled = true) {
    this._blockAllInput = enabled;
  }

  blockKbMouse(enabled = true) {
    this._blockKbMouse = enabled;
  }

  /**
   * Returns spScrollDown or spScrollUp. Returns null if delta is 0.
   * @param {number} deltaY
   * @returns {string|null}
   */
  keyFromWheelDelta(deltaY) {
    if (deltaY === 0){
      return null;
    } else if (deltaY > 0) {
      // Scrolling down.
      return 'spScrollDown';
    } else {
      // Scrolling up.
      return 'spScrollUp';
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {AnalogSource} source
   */
  calculateAnalogData(x, y, source) {
    let prevX = source === AnalogSource.mouse ? this._prevMouseX : this._prevControllerX;
    let prevY = source === AnalogSource.mouse ? this._prevMouseY : this._prevControllerY;

    let deltaX = x - prevX;
    let deltaY = y - prevY;

    let xKey = 'spEastWest'; // x > prevX ? 'spEast' : 'spWest';
    let yKey = 'spNorthSouth'; // y > prevY ? 'spSouth' : 'spNorth';

    // Below: sp means 'special'. Or 'somewhat promiscuous'. Whatever. Used to
    // indicate the 'key' is non-standard.
    let results = {
      x: {
        key: xKey, // complement: yKey,
        delta: x, gravDelta: deltaX,
      },
      y: {
        key: yKey, // complement: xKey,
        delta: y, gravDelta: deltaY,
      },
    };

    if (source === AnalogSource.mouse) {
      this._prevMouseX = x;
      this._prevMouseY = y;
    }
    else {
      this._prevControllerX = x;
      this._prevControllerY = y;
    }

    return results;
  }

  getMode(modeId: ModeId) {
    return this._modes[modeId];
  }

  getModeApp() {
    return this._modes[ModeId.appControl];
  }

  getModePlayer() {
    return this._modes[ModeId.playerControl];
  }

  getModeMenu() {
    return this._modes[ModeId.menuControl];
  }

  getModeVirtualMenu() {
    return this._modes[ModeId.virtualMenuControl];
  }

  registerController(controller: ModeController) {
    this._modes[controller.modeId][controller.name] = controller;
    this._allControllers[controller.name] = controller;
  }

  activateController(modeId: ModeId, controllerName: string) {
    // console.log(`Activating controller ${controllerName} (in mode ${ModeId[modeId]})`);
    const controller = this._modes[modeId][controllerName];
    if (!controller) {
      console.error(`[InputManager] Controller ${ModeId[modeId]}.${controllerName} is not defined (using this._modes[${modeId}][${controllerName}]).`);
      return;
    }
    this._activeControllers[modeId] = controllerName;
    controller.onActivateController();
  }

  propagateInput({ key, value, analogData } : { key: string, value: number, analogData?: {} }) {
    if (this._blockAllInput) {
      return;
    }

    const active = this._activeControllers;
    for (let i = 0, len = active.length; i < len; i++) {
      const controller: ModeController = this._allControllers[active[i]];
      if (!controller) {
        continue;
      }

      const actions = controller.controlsByKey[key];
      if (typeof actions === 'undefined') {
        continue;
      }

      if (actions.length === 1) {
        // const keyType = actions[0]
        controller.receiveAction({ action: actions[0], key, value, analogData });
        return;
      }
      else {
        for (let i = 0, len = actions.length; i < len; i++) {
          controller.receiveAction({ action: actions[i], key, value, analogData });
        }
      }
    }
  }

  stepActiveControllers({ delta, bigDelta }) {
    const active = this._activeControllers;
    for (let i = 0, len = active.length; i < len; i++) {
      const controller: ModeController = this._allControllers[active[i]];
      if (controller?.step) {
        controller.step(delta, bigDelta);
      }
    }
  }
}

const inputManagerPlugin = new CosmosisPlugin('inputManager', InputManager);

export {
  InputManager,
  inputManagerPlugin,
};
