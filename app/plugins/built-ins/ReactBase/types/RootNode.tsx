import _ from 'lodash';
import React from 'react';
import ModeController from '../../InputManager/types/ModeController';
import PluginCacheTracker from '../../../../emitters/PluginCacheTracker';
import Core from '../../Core';
import { InputManager } from '../../InputManager';
import { FadeInDown } from '../animations/FadeInDown';
import InputBridge from './InputBridge';
import MenuHorizontal from '../menuTypes/MenuHorizontal';
import MenuVertical from '../menuTypes/MenuVertical';

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
  top: '50%',
  transform: 'translateY(-50%)',
  justifyContent: 'center',
  position: 'absolute',
  display: 'flex',
  width: '100%',
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
        { name: 'Item 1', onSelect: (e) => console.log('selected 1:', e) },
        { name: 'Item 2', onSelect: (e) => console.log('selected 2:', e) },
        { name: 'Item 3', onSelect: (e) => console.log('selected 3:', e) },
      ],
      alwaysShowDescriptionBox: true,
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
