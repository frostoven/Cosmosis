import CosmosisPlugin from '../../types/CosmosisPlugin';
import { ModeId } from './types/ModeId';
import { ModeStructure } from './interfaces/ModeStructure';
import { MouseDriver } from '../MouseDriver';
import { gameRuntime } from '../../gameRuntime';
import { AnalogSource } from './types/AnalogSource';

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

const mouseFriendly = [
  'Left', 'Middle', 'Right',
];

// Nomenclature:
// Mode: a logical group of controllers.
// Controller: something capable of responding to key input.
class InputManager {
  private readonly _modes: Array<{ [key: string]: ModeStructure }>;
  private readonly _activeControllers: Array<string>;
  private readonly _allControllers: {};
  private _mouseDriver: MouseDriver;
  public allowBubbling: boolean;

  private readonly _heldButtons: { [key: string]: boolean };
  private _prevMouseX: number;
  private _prevMouseY: number;
  private _prevControllerX: number;
  private _prevControllerY: number;

  constructor() {
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

    this._setupWatchers();
    this._setupInputListeners();
  }

  _setupWatchers() {
    gameRuntime.tracked.mouseDriver.getEveryChange((mouseDriver) => {
      this._mouseDriver = mouseDriver;
    });
  }

  _setupInputListeners() {
    const listener = this._universalEventListener.bind(this);
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
  _universalEventListener(event) {
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

    let isDown = true;
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
        key = `spMouse${mouseFriendly[event.button]}`;
        break;
      case 'mouseup':
        key = `spMouse${mouseFriendly[event.button]}`;
      // Note: fallthrough is intentional here.
      case 'keyup':
        isDown = false;
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
        key: analogData.x.key,
        isDown,
        analogData: { delta: xData.delta, gravDelta: xData.gravDelta },
      });
      this.propagateInput({
        key: analogData.y.key,
        isDown,
        analogData: { delta: yData.delta, gravDelta: yData.gravDelta },
      });
    }
    else {
      // All other kinds of events covered in this block.
      if (!isNeverHeld) {
        // Prevent event spam by keeping track of which buttons are currently held
        // down.
        if (!isDown) {
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

      this.propagateInput({ key, isDown });

      // Immediately trigger a button release for buttons that cannot be held (such
      // as scroll wheels).
      if (isNeverHeld) {
        this.propagateInput({ key: key, isDown: false });
      }
    }
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

    let xKey = x > prevX ? 'spEast' : 'spWest';
    let yKey = y > prevY ? 'spSouth' : 'spNorth';

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

  registerController(name: string, modeId: ModeId, controlsByKey, onAction: Function) {
    const controller = { name, modeId, controlsByKey, onAction };
    this._modes[modeId][name] = controller;
    this._allControllers[name] = controller;
  }

  activateController(modeId: ModeId, controllerName: string) {
    const controller = this._modes[modeId][controllerName];
    if (!controller) {
      console.error(`[InputManager] Controller ${ModeId[modeId]}.${controllerName} is not defined (using this._modes[${modeId}][${controllerName}]).`);
      return;
    }
    this._activeControllers[modeId] = controllerName;
  }

  propagateInput({ key, isDown, analogData } : { key: string, isDown: boolean, analogData?: {} }) {
    const active = this._activeControllers;
    for (let i = 0, len = active.length; i < len; i++) {
      const controller: ModeStructure = this._allControllers[active[i]];
      if (!controller) {
        continue;
      }

      const action = controller.controlsByKey[key];
      if (action) {
        controller.onAction({ action, isDown, analogData });
        return;
      }
    }
  }
}

const inputManagerPlugin = new CosmosisPlugin('inputManager', InputManager);

export {
  InputManager,
  inputManagerPlugin,
};
