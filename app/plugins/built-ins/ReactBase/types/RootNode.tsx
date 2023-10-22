import _ from 'lodash';
import React from 'react';
import ModeController from '../../InputManager/types/ModeController';
import { ModeId } from '../../InputManager/types/ModeId';
import { reactControls } from './controls';
import PluginCacheTracker from '../../../../emitters/PluginCacheTracker';
import Core from '../../Core';
import { InputManager } from '../../InputManager';
import { FadeIn } from '../animations/FadeIn';
import { FadeInDown } from '../animations/FadeInDown';
import MenuVertical from '../menuTypes/MenuVertical';
import InputBridge from './InputBridge';

const rootNodeStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.30)',
  zIndex: 25,
};

const centerBoth: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
};

type PluginCompletion = PluginCacheTracker & {
  core: Core, inputManager: InputManager,
};

interface Props {
}

export default class RootNode extends React.Component<Props> {
  private _pluginTracker: PluginCacheTracker | PluginCompletion;
  private _modeController!: ModeController;
  private _input = new InputBridge();

  state = {
    menuVisible: false,
    // lastAction: 'none',
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this._pluginTracker = new PluginCacheTracker([ 'core', 'inputManager' ]);
  }

  componentDidMount() {
    this._input.onAction.getEveryChange(this.handleAction);
  }

  componentWillUnmount() {
    this._input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (action: string) => {
    if (action === 'back') {
      this.setState({ menuVisible: !this.state.menuVisible });
      this._input.enableArrowStepping = this.state.menuVisible;
    }
  };

  render() {
    if (!this.state.menuVisible) {
      return null;
    }

    const menuOptions = {
      type: 'MenuVertical',
      default: 1,
      entries: [
        { name: 'Item 1', onSelect: () => console.log('selected 1'), },
        { name: 'Item 2', onSelect: () => console.log('selected 2'), },
        { name: 'Item 3', onSelect: () => console.log('selected 3'), },
      ],
    };

    return (
      <FadeInDown style={rootNodeStyle}>
        <MenuVertical
          options={menuOptions}
          style={centerBoth}
        >
          Test
        </MenuVertical>
      </FadeInDown>
    );
  }
}
