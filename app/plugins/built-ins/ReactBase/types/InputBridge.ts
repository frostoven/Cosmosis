import ModeController from '../../InputManager/types/ModeController';
import { ModeId } from '../../InputManager/types/ModeId';
import Core from '../../Core';
import ChangeTracker from 'change-tracker/src';
import { ControlSchema } from '../../InputManager/interfaces/ControlSchema';

const animationData = Core.animationData;

const ARROW_DELAY_S = 3.5;
const ARROW_REPEAT_S = 0.5;

export default class InputBridge {
  public readonly name: string;
  public readonly modeId: ModeId;

  private readonly _enableArrowStepping: boolean = false;
  public onAction = new ChangeTracker();

  public readonly modeController!: ModeController;

  private _arrowCountdown = ARROW_DELAY_S;

  state = {
    menuVisible: false,
    lastAction: 'none',
  };

  constructor(
    menuName: string,
    modeId: ModeId,
    controlSchema: ControlSchema,
    automaticArrowStepping = false,
  ) {
    this.name = menuName;
    this.modeId = modeId;
    this._enableArrowStepping = automaticArrowStepping;

    const uiInfo = { friendly: 'Menu Controls', priority: 1 };
    this.modeController = new ModeController(
      menuName, modeId, controlSchema, uiInfo,
    );
    this.modeController.step = this.stepArrowStream.bind(this);
  }

  /**
   * You may find your menu class doing a lot of this:
   * ```javascript
   * const mc = inputBridge.modeController;
   * // Notice the reuse of 'myActionName':
   * mc.pulse.myActionName.getEveryChange(() =>
   *   this.onAction.setValue('myActionName'),
   * );
   * ```
   * This function repeats the above for every specified pulse control name.
   * @param actionNames
   */
  autoConfigurePulseKeys(actionNames: string[]) {
    const mc = this.modeController;
    for (let i = 0, len = actionNames.length; i < len; i++) {
      const actionName = actionNames[i];
      mc.pulse[actionName].getEveryChange(() => {
        console.log('-> [InputBridge] actionName:', actionName);
        this.onAction.setValue(actionName);
      });
    }
  }

  // Manages arrow timing.
  stepArrowStream() {
    // Disable all key repeat processing while menu is closed.
    if (!this._enableArrowStepping) {
      return;
    }

    const mc = this.modeController;
    let { up, down, left, right } = mc.absoluteInput;

    if (up || down || left || right) {
      this._repeatArrow();
    }
    else {
      this._arrowCountdown = ARROW_DELAY_S;
    }
  }

  // Handles arrow logic.
  tickArrow() {
    const mc = this.modeController;
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

  _repeatArrow = () => {
    if (this._arrowCountdown === ARROW_DELAY_S) {
      // Always tick immediately after the user presses a key. The delays are
      // for repeating only; we don't want a delay the moment they user presses
      // the key.
      this.tickArrow();
    }

    this._arrowCountdown -= animationData.delta;
    if (this._arrowCountdown <= 0) {
      this.tickArrow();
      this._arrowCountdown = ARROW_REPEAT_S;
    }
  };
}
