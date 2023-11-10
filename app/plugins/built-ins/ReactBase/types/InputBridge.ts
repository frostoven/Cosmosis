import _ from 'lodash';
import ModeController from '../../InputManager/types/ModeController';
import { ModeId } from '../../InputManager/types/ModeId';
import { reactMenuControls } from './controls';
import PluginCacheTracker from '../../../../emitters/PluginCacheTracker';
import Core from '../../Core';
import { InputManager } from '../../InputManager';
import ChangeTracker from 'change-tracker/src';

const ARROW_DELAY = 500;
const ARROW_REPEAT_MS = 50;

let singletonInstance: InputBridge;

type PluginCompletion = PluginCacheTracker & {
  core: Core, inputManager: InputManager,
};

interface Props {
}

export default class InputBridge {
  public enableArrowStepping = false;
  public onAction = new ChangeTracker();
  // public onBack = new ChangeTracker();
  // public onArrow = new ChangeTracker();

  private _pluginTracker!: PluginCacheTracker | PluginCompletion;
  private _modeController!: ModeController;

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

    this._pluginTracker = new PluginCacheTracker([ 'core', 'inputManager' ]);

    this._pluginTracker.onAllPluginsLoaded.getOnce(() => {
      const uiInfo = { friendly: 'Menu Controls', priority: 1 };
      this._modeController = new ModeController(
        'menuSystem', ModeId.menuControl, reactMenuControls, uiInfo,
      );
      this._modeController.step = this.stepArrowStream.bind(this);

      const inputManager: InputManager = this._pluginTracker.inputManager;
      inputManager.activateController(ModeId.menuControl, 'menuSystem');
      this._setupPulseWatchers();
    });
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
  }

  // Manages arrow timing.
  stepArrowStream(_, bigDelta) {
    // Disable all key repeat processing while menu is closed.
    if (!this.enableArrowStepping) {
      return;
    }

    const mc = this._modeController;
    let { up, down, left, right } = mc.state;

    if (up || down || left || right) {
      this._repeatDelta = bigDelta;
      this._repeatArrow();
    }
    else {
      this._arrowCountdown = ARROW_DELAY;
    }
  }

  // Handles arrow logic.
  tickArrow() {
    const mc = this._modeController;
    let { up, down, left, right } = mc.state;

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
