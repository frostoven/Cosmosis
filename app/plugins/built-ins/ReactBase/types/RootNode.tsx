import _ from 'lodash';
import React from 'react';
import ModeController from '../../InputManager/types/ModeController';
import { ModeId } from '../../InputManager/types/ModeId';
import { reactControls } from './controls';
import PluginCacheTracker from '../../../../emitters/PluginCacheTracker';
import Core from '../../Core';
import { InputManager } from '../../InputManager';
import { FadeIn } from '../animations/FadeIn';

const ARROW_DELAY = 500;
const ARROW_REPEAT_MS = 50;

const rootNodeStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.30)',
  zIndex: 25,
};

type PluginCompletion = PluginCacheTracker & {
  core: Core, inputManager: InputManager,
};

interface Props {
}

export default class RootNode extends React.Component<Props> {
  private _pluginTracker: PluginCacheTracker | PluginCompletion;
  private _modeController!: ModeController;

  private readonly _repeatArrow: Function;
  private _repeatDelta: number = 0;
  private _arrowCountdown = ARROW_DELAY;

  state = {
    menuVisible: false,
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this._pluginTracker = new PluginCacheTracker([ 'core', 'inputManager' ]);

    this._repeatArrow = _.throttle(() => {
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

    this._pluginTracker.onAllPluginsLoaded.getOnce(() => {
      this._modeController = new ModeController('mainMenuSystem', ModeId.menuControl, reactControls);
      this._modeController.step = this.stepArrowStream.bind(this);
      const inputManager: InputManager = this._pluginTracker.inputManager;
      inputManager.activateController(ModeId.menuControl, 'mainMenuSystem');
      this._setupPulseWatchers();
    });
  }

  _setupPulseWatchers() {
    const mc = this._modeController;
    mc.pulse.back.getEveryChange(() => { this.onBack() });
  }

  onBack() {
    console.log('Back pressed.');
    this.setState({ menuVisible: !this.state.menuVisible });
  }

  // Manages arrow timing.
  stepArrowStream(_, bigDelta) {
    // Disable all key repeat processing while menu is closed.
    if (!this.state.menuVisible) {
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
      console.log('up');
    }
    else if (down) {
      console.log('down');
    }
    else if (left) {
      console.log('left');
    }
    else if (right) {
      console.log('right');
    }
  }

  menuUp() {
    //
  }

  menuDown() {
    //
  }

  render() {
    if (!this.state.menuVisible) {
      return null;
    }

    return (
      <FadeIn style={rootNodeStyle}>
        <div></div>
      </FadeIn>
    );
  }
}
