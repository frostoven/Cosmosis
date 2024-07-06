import _ from 'lodash';
import ModeController from '../../InputManager/types/ModeController';
import { ModeId } from '../../InputManager/types/ModeId';
import { reactMenuControls } from './controls';
import PluginCacheTracker from '../../../../emitters/PluginCacheTracker';
import Core from '../../Core';
import { InputManager } from '../../InputManager';
import ChangeTracker from 'change-tracker/src';

const animationData = Core.animationData;

const ARROW_DELAY = 500;
const ARROW_REPEAT_MS = 50;

let singletonInstance: InputBridge;


// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  inputManager: InputManager,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

export default class InputBridge {
  public enableArrowStepping = false;
  public onAction = new ChangeTracker();
  // public onBack = new ChangeTracker();
  // public onArrow = new ChangeTracker();

  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private readonly _modeController!: ModeController;

  private _repeatDelta: number = 0;
  private _arrowCountdown = ARROW_DELAY;
  private readonly _repeatArrow = _.throttle(() => {
    if (this._arrowCountdown === ARROW_DELAY) {
      this.tickArrow();
    }
    this._arrowCountdown -= ARROW_REPEAT_MS * this._repeatDelta;
    if (this._arrowCountdown < 0) {
      this.tickArrow();
    }
  }, ARROW_REPEAT_MS, {
    // @ts-ignore - Unsure if the error is correct, this popped up after
    // installing the types package. Maybe needs investigation.
    maxDelay: ARROW_REPEAT_MS,
    leading: true,
    trailing: false,
  });

  state = {
    menuVisible: false,
    lastAction: 'none',
  };

  constructor() {
    if (singletonInstance) {
      return singletonInstance;
    }
    else {
      singletonInstance = this;
    }

    const uiInfo = { friendly: 'Menu Controls', priority: 1 };
    this._modeController = new ModeController(
      'menuSystem', ModeId.menuControl, reactMenuControls, uiInfo,
    );
    this._modeController.step = this.stepArrowStream.bind(this);

    this._setupPulseWatchers();
  }

  _setupPulseWatchers() {
    const mc = this._modeController;
    mc.pulse.back.getEveryChange(() => this.onAction.setValue('back'));
    mc.pulse.select.getEveryChange(() => this.onAction.setValue('select'));
    mc.pulse.saveChanges.getEveryChange(() => this.onAction.setValue('saveChanges'));
    mc.pulse.delete.getEveryChange(() => this.onAction.setValue('delete'));
    mc.pulse.resetBinding.getEveryChange(() => this.onAction.setValue('resetBinding'));
    mc.pulse.search.getEveryChange(() => this.onAction.setValue('search'));
    mc.pulse.advanced.getEveryChange(() => this.onAction.setValue('advanced'));
    mc.pulse.manageMacros.getEveryChange(() => this.onAction.setValue('manageMacros'));
    mc.pulse.emergencyMenuClose.getEveryChange(() => this.onAction.setValue('emergencyMenuClose'));
    mc.pulse._openMenu.getEveryChange(() => this.onAction.setValue('_openMenu'));
    mc.pulse._closeMenu.getEveryChange(() => this.onAction.setValue('_closeMenu'));
  }

  // We receive the back button from general control, so we need to dynamically
  // make it open, close, or move back as needed.
  activateAndOpenMenu() {
    const mc = this._modeController;
    const inputManager: InputManager = this._pluginCache.inputManager;
    if (!inputManager.isControllerActive(ModeId.menuControl)) {
      inputManager.activateController(ModeId.menuControl, 'menuSystem');
      mc.pulse._openMenu.setValue({ action: '_openMenu', value: 1 });
      mc.pulse._openMenu.setValue({ action: '_openMenu', value: 0 });
    }
    else {
      mc.pulse.back.setValue({ action: 'back', value: 1 });
      mc.pulse.back.setValue({ action: 'back', value: 0 });
    }
  }

  deactivateAndCloseMenu() {
    const mc = this._modeController;
    const inputManager: InputManager = this._pluginCache.inputManager;
    inputManager.deactivateController(ModeId.menuControl, 'menuSystem');
    mc.pulse._closeMenu.setValue({ action: '_closeMenu', value: 1 });
    mc.pulse._closeMenu.setValue({ action: '_closeMenu', value: 0 });
  }

  // Manages arrow timing.
  stepArrowStream() {
    const { normalizedDelta } = animationData;

    // Disable all key repeat processing while menu is closed.
    if (!this.enableArrowStepping) {
      return;
    }

    const mc = this._modeController;
    let { up, down, left, right } = mc.absoluteInput;

    if (up || down || left || right) {
      this._repeatDelta = normalizedDelta;
      this._repeatArrow();
    }
    else {
      this._arrowCountdown = ARROW_DELAY;
    }
  }

  // Handles arrow logic.
  tickArrow() {
    const mc = this._modeController;
    let { up, down, left, right } = mc.absoluteInput;

    // Disallow confusion.
    if (up && down) {
      up = down = 0;
    }
    if (left && right) {
      left = right = 0;
    }

    if (up) {
      this.onAction.setValue('up');
    }
    else if (down) {
      this.onAction.setValue('down');
    }
    else if (left) {
      this.onAction.setValue('left');
    }
    else if (right) {
      this.onAction.setValue('right');
    }
  }
}
