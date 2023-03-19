import _ from 'lodash';
import React from 'react';
import { Icon, Tab } from 'semantic-ui-react';
import Draggable from 'react-draggable'
import { cosmDbg } from '../index';
import { genVariableHijacker } from '../modules/variableHijacker';
import { genActions } from '../modules/actions';
import { genSettings } from '../modules/settings';
import { pickIconByTime } from '../debuggerUtils';
import { CosmDbgRootUtils } from './interfaces/CosmDbgRootUtils';

const CONTAINER_STYLE = {
  backgroundColor: '#282828',
  // borderRadius: '4px 4px 0 0',
};

const TITLE_BAR_STYLE = {
  backgroundColor: '#343434',
  padding: 8,
  // borderRadius: '4px 4px 0 0',
};

const TITLE_BAR_BUTTONS = {
  float: 'right',
};

export default class CosmDbgMain extends React.Component {
  static defaultState = { rootActiveTab: 0, isCollapsed: false, confirmingReload: false };
  state: { [key: string]: any } = { ...CosmDbgMain.defaultState };
  private _iconTimer:  NodeJS.Timeout | null;

  constructor(props) {
    super(props);
    this.state = cosmDbg.getState()?.uiState || {};
    this._iconTimer = null;
  }

  componentDidMount() {
    this.advanceIcon();
  }

  // This is used to ensure the icon updates when the system time advances a
  // minute. This can drift by some seconds under heavy load, but will
  // autocorrect alignment after every update.
  advanceIcon() {
    const currentSeconds = new Date().getSeconds();
    let nextUpdate = 60 - currentSeconds;
    if (nextUpdate < 5) {
      nextUpdate = 5;
    }
    this._iconTimer = setTimeout(() => {
      this.setState({ forceRerender: Math.random() }, () => {
        this.advanceIcon();
      });
    }, nextUpdate * 1000);
  }

  // By storing all state in the debugger root, we can easily save exact state
  // and restore it during reboots. The purpose is to give the feel that the
  // debugger keeps running across code-change-induced reboots.
  setPersistentState = (state, callback = () => {}) => {
    this.setState(state, () => {
      cosmDbg.setOption('uiState', this.state);
      callback();
    });
  };

  resetPersistentState = (callback = () => {}) => {
    const newState = {};
    _.each(this.state, (value, key) => {
      newState[key] = undefined;
    });

    this.setState({
      ...CosmDbgMain.defaultState,
      ...newState,
    }, () => {
      cosmDbg.resetState();
      callback();
    });
  };

  handleTabChange = (event, { activeIndex }) => {
    this.setPersistentState({ rootActiveTab: activeIndex });
  };

  handleClose = () => {
    cosmDbg.hideUI();
  };

  handleCollapse = () => {
    this.setPersistentState({ isCollapsed: !this.state.isCollapsed });
  };

  handleShowDevTools = () => {
    // @ts-ignore
    nw.Window.get().showDevTools();
  };

  handleReloadClick = () => {
    if (!this.state.confirmingReload) {
      this.setState({ confirmingReload: true });
      // If the user doesn't confirm after 4 seconds, undo confirmation check.
      setTimeout(() => {
        this.setState({ confirmingReload: false });
      }, 4000);
    }
    else {
      // @ts-ignore
      nw.Window.get().reloadIgnoringCache();
    }
  };

  render() {
    const rootUtils: CosmDbgRootUtils = {
      rootState: this.state,
      setPersistentState: this.setPersistentState,
      resetPersistentState: this.resetPersistentState,
    };

    let activeTab = this.state.rootActiveTab;
    if (typeof activeTab === 'undefined') {
      activeTab = 0;
    }

    return (
      <Draggable
        handle=".cosm-dbg-handle"
      >
        <div style={CONTAINER_STYLE}>
          <div className="cosm-dbg-handle" style={TITLE_BAR_STYLE}>
            <Icon name={pickIconByTime()}/>
            &nbsp;CosmDbg&nbsp;&nbsp;
            {/* @ts-ignore */}
            <div style={TITLE_BAR_BUTTONS}><Icon name='close' onClick={this.handleClose}/></div>
            {/* @ts-ignore */}
            <div style={TITLE_BAR_BUTTONS}><Icon name='sort' onClick={this.handleCollapse}/></div>
            <div
              // @ts-ignore
              style={{ ...TITLE_BAR_BUTTONS, paddingRight: 2, }}
            >
              <Icon name='terminal' size='small' onClick={this.handleShowDevTools}/>
            </div>
            <div
              // @ts-ignore
              style={{ ...TITLE_BAR_BUTTONS, paddingRight: 6, }}
            >
              <Icon
                name={this.state.confirmingReload ? 'exclamation triangle' : 'redo'}
                size='small'
                onClick={this.handleReloadClick}
              />
            </div>
          </div>
          <Tab
            style={{ display: this.state.isCollapsed ? 'none' : 'block' }}
            activeIndex={activeTab}
            // @ts-ignore - definition is wrong.
            onTabChange={this.handleTabChange}
            panes={[
              genVariableHijacker({ rootUtils }),
              genActions({ rootUtils }),
              genSettings({ rootUtils }),
            ]}
          />
        </div>
      </Draggable>
    );
  }
}
