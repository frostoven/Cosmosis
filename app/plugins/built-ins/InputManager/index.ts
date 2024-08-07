// Apologies for this file and its related classes being a little messy, they
// were hastily ported from JS which, unlike TS, didn't complain about a lot of
// important stuff. It needs a good amount of cleanup.

import _ from 'lodash';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import Modal from '../../../modal/Modal';
import { ModeId } from './types/ModeId';
import { MouseDriver } from '../MouseDriver';
import { AnalogSource } from './types/AnalogSource';
import ModeController from './types/ModeController';
import Core from '../Core';
import { InputSchemeEntry } from './interfaces/InputSchemeEntry';
import {
  MouseButtonName,
  scrollDeltaToEnum,
} from '../../../configs/types/MouseButtonName';
import { logBootTitleAndInfo } from '../../../local/windowLoadListener';
import PluginLoader from '../../types/PluginLoader';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  mouseDriver: MouseDriver,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

/*
 * Mechanism:
 * Controllers register themselves. The registration puts them inside a mode.
 * (Note that freeCam and helmControl are two controllers in a single mode:
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
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;

  // Can be used to test key processing latency. At time the of wiring, takes
  // less than 0.1ms (0.0001 seconds) under medium load, and immeasurably small
  // (reported as 0ms) under low load, to reach the end of receiveAsKbButton.
  // receiveAsKbButton is pretty much the last step in the processing queue.
  // Unconscious human reflexes sit at around 80ms (0.08 seconds), so our
  // performance is acceptable.
  public static lastPressTime = -1;

  /**
   * To prevent laptop users accidentally scrolling horizontally, we explicitly
   * only allow vertical scrolling. Modders may enable 2-way scrolling like so:
   * @example
   * InputManager.scrollDetector = scrollTouchpadDeltaToEnum;
   * @tutorial - Modders will need to override the Modal class as well.
   * @type {(scrollDelta: number) => ScrollName.spScrollUp | ScrollName.spScrollDown}
   */
  static scrollDetector = scrollDeltaToEnum;

  // This should only be disabled for debugging purposes. When this is
  // disabled, mode priority is ignored completely.
  public enableBindingCache = true;
  public bindingCache: { [keyName: string]: ModeController } | null = null;

  private _blockAllInput: boolean;
  private _blockKbMouse: boolean;

  private readonly _modes: Array<{ [key: string]: ModeController }>;
  private readonly _activeControllers: Array<string>;
  private readonly _allControllers: {};
  public allowBubbling: boolean;

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
      (entry: InputSchemeEntry) => entry.priority || 0,
      [ 'desc' ],
    ) as InputSchemeEntry[];
  };

  constructor() {
    logBootTitleAndInfo('Driver', 'Input Wiring', PluginLoader.bootLogIndex);
    this.allowBubbling = false;
    this._blockAllInput = false;
    this._blockKbMouse = false;

    // Note: we divide by 2 because TS generates both an index and a key name
    // for each entry.
    const modeCount = Object.keys(ModeId).length / 2;
    this._activeControllers = [];
    this._modes = [];
    for (let i = 0; i < modeCount; i++) {
      this._activeControllers.push('');
      this._modes.push({});
    }

    // Contains literally all controllers, both inclusive and mutually
    // exclusive.
    this._allControllers = {};

    this._heldButtons = {};
    this._prevMouseX = 0;
    this._prevMouseY = 0;
    this._prevControllerX = 0;
    this._prevControllerY = 0;

    this._pluginCache.core.onAnimate.getEveryChange(this.stepActiveControllers.bind(this));
    this._setupInputListeners();
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
        // @ts-ignore - Unsure why this isn't visible, it is defined.
        if (!this._pluginCache.mouseDriver.isPointerLocked) {
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
        key = InputManager.scrollDetector(event);
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
        analogData: {
          delta: xData.delta,
          gravDelta: xData.gravDelta,
          complement: xData.complement,
        },
      });
      this.propagateInput({
        key: yData.key,
        value,
        analogData: {
          delta: yData.delta,
          gravDelta: yData.gravDelta,
          complement: yData.complement,
        },
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

  registerController(controller: ModeController) {
    this._modes[controller.modeId][controller.name] = controller;
    this._allControllers[controller.name] = controller;
  }

  activateController(modeId: ModeId, controllerName: string) {
    // console.log(`Activating controller ${controllerName} (in mode ${ModeId[modeId]})`);
    const controller = this._modes[modeId][controllerName];
    if (!controller) {
      console.error(
        `[InputManager] Controller ${ModeId[modeId]}.${controllerName} is`,
        `not defined (using this._modes[${modeId}][${controllerName}]).`,
      );
      return;
    }
    this._activeControllers[modeId] = controllerName;
    controller.onActivateController();
    this.buildBindingCache();
  }

  deactivateController(modeId: ModeId, controllerName: string) {
    const controller = this._modes[modeId][controllerName];
    if (!controller) {
      console.error(
        `[InputManager] Controller ${ModeId[modeId]}.${controllerName} is`,
        `not defined (using this._modes[${modeId}][${controllerName}]).`,
      );
      return;
    }
    this._activeControllers[modeId] = '';
    controller.onDeactivateController();
    this.buildBindingCache();
  }

  isControllerActive(modeId: ModeId) {
    return !!this._activeControllers[modeId];
  }

  propagateInput({
    key, value, analogData,
  }: {
    key: string, value: number, analogData?: {},
  }) {
    if (this._blockAllInput) {
      return;
    }

    if (!this.enableBindingCache) {
      return this._propagateInputIgnoringPriority({ key, value, analogData });
    }

    if (!this.bindingCache) {
      this.buildBindingCache();
    }

    const controller = this.bindingCache![key];
    if (!controller) {
      // This key is not assigned to anything.
      return;
    }

    const actions = controller.controlsByKey[key];
    if (actions.length === 1) {
      controller.receiveAction({
        action: actions[0],
        key,
        value,
        // @ts-ignore
        analogData,
      });
      return;
    }
    else {
      for (let i = 0, len = actions.length; i < len; i++) {
        // @ts-ignore
        controller.receiveAction({
          action: actions[i],
          key,
          value,
          // @ts-ignore
          analogData,
        });
      }
    }
  }

  buildBindingCache() {
    // Dev note: Cache rebuilds generally take 0.5ms to 1ms on my machine.
    const bindings = {};
    const controllerNames = this._activeControllers;

    // Start with the lowest priority modes and point their keybindings to
    // their respective controlling instances. If a higher priority instance
    // has the same keybinding, replace the lower priority binding with the
    // higher priority one.
    for (let i = controllerNames.length - 1; i >= -1; i--) {
      const name = controllerNames[i];
      if (!name) {
        // No controllers currently use this ID.
        continue;
      }
      const controller: ModeController = this._allControllers[name];
      const controlsByKey = controller.controlsByKey;
      _.each(controlsByKey, (actions, keyName) => {
        bindings[keyName] = controller;
      });
    }
    this.bindingCache = bindings;
  }

  // Used for debugging only.
  _propagateInputIgnoringPriority({
    key, value, analogData,
  }: {
    key: string, value: number, analogData?: {},
  }) {
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
        controller.receiveAction({
          action: actions[0],
          key,
          value,
          // @ts-ignore
          analogData,
        });
        return;
      }
      else {
        for (let i = 0, len = actions.length; i < len; i++) {
          controller.receiveAction({
            action: actions[i],
            key,
            value,
            // @ts-ignore
            analogData,
          });
        }
      }
    }
  }

  stepActiveControllers() {
    const active = this._activeControllers;
    for (let i = 0, len = active.length; i < len; i++) {
      const controller: ModeController = this._allControllers[active[i]];
      if (controller?.step) {
        controller.step();
      }
    }
  }
}

const inputManagerPlugin = new CosmosisPlugin('inputManager', InputManager);

export {
  InputManager,
  inputManagerPlugin,
};
