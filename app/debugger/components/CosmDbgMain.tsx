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
import { gameRuntime } from '../../plugins/gameRuntime';
import { HeightSetting } from './types/HeightSetting';

const CONTAINER_STYLE: React.CSSProperties = {
  backgroundColor: '#282828',
  // borderRadius: '4px 4px 0 0',
  minWidth: 420,
};

const TITLE_BAR_STYLE: React.CSSProperties = {
  backgroundColor: '#343434',
  padding: 8,
  userSelect: 'none',
};

const TITLE_BAR_STYLE_COLLAPSED: React.CSSProperties = {
  background: 'url(/css/debuggerImages/background-2.png)',
  backgroundPosition: 238,
  backgroundPositionY: 54,
  // @ts-ignore - needed to fix react complaint.
  backgroundColor: null,
};

const TITLE_BAR_BUTTONS: React.CSSProperties = {
  float: 'right',
};

const TAB_CONTENT_STYLE: React.CSSProperties = {
  display: 'block',
  background: 'url(/css/debuggerImages/background-2.png)',
  backgroundPosition: -12,
};

const draggableHandles = '.cosm-dbg-handle, .ui.attached.tabular.menu';

interface Props {
  firstTimeBoot: boolean,
}

export default class CosmDbgMain extends React.Component<Props> {
  static defaultState = {
    rootActiveTab: 0,
    modalSize: HeightSetting.large,
    confirmingReload: false,
    hoverActive: false,
    allowDragging: true,
  };
  state: { [key: string]: any } = { ...CosmDbgMain.defaultState };
  private readonly ref: React.RefObject<any>;
  private _iconTimer:  NodeJS.Timeout | null;

  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = cosmDbg.getState()?.uiState || {};
    this.state.hoverActive = false;
    this.state.confirmingReload = false;
    this._iconTimer = null;
  }

  componentDidMount() {
    if (this.props.firstTimeBoot) {
      this.resetPersistentState(() => {
        cosmDbg.firstTimeBoot = false;
        this.init();
      })
    }
    else {
      this.init();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.bindDevToolKey.bind(this));
  }

  init() {
    this.advanceIcon();
    this.grabInputOnHover();
    window.addEventListener('keyup', this.bindDevToolKey.bind(this));
  }

  grabInputOnHover = () => {
    const element = this.ref.current;
    element.addEventListener('mouseover', () => {
      this.state.hoverActive || this.setState({ hoverActive: true });
      gameRuntime.tracked.inputManager.getOnce((instance) => {
        instance.blockKbMouse();
      });
    }, false);
    element.addEventListener('mouseleave', () => {
      this.state.hoverActive && this.setState({ hoverActive: false });
      gameRuntime.tracked.inputManager.getOnce((instance) => {
        instance.blockKbMouse(false);
      });
    }, false);
  };

  // This is used to ensure the icon updates when the system time advances a
  // minute. This can drift by some seconds under heavy load, but will
  // autocorrect alignment after every update.
  advanceIcon = () => {
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
  };

  // By storing all state in the debugger root, we can easily save exact state
  // and restore it during reboots. The purpose is to give the feel that the
  // debugger keeps running across code-change-induced reboots.
  setPersistentState = (state, callback = () => {}) => {
    this.setState(state, () => {
      cosmDbg.setOption('uiState', this.state);
      callback();
    });
  };

  bindDevToolKey(event) {
    if (this.state.hoverActive) {
      // @ts-ignore
      (event.code === 'F5') && chrome.tabs.reload();
      // @ts-ignore
      (event.code === 'F11') && nw.Window.get().toggleFullscreen();
      // @ts-ignore
      (event.code === 'F12') && nw.Window.get().showDevTools();
    }
  }

  resetPersistentState = (callback = () => {}) => {
    const newState = {};
    _.each(this.state, (value, key) => {
      newState[key] = undefined;
    });

    cosmDbg.resetState();
    this.setState({
      ...newState,
      ...CosmDbgMain.defaultState,
    }, () => {
      cosmDbg.setOption('uiState', this.state);
      callback();
    });
  };

  handleTabChange = (event, { activeIndex }) => {
    this.setPersistentState({ rootActiveTab: activeIndex });
  };

  handleClose = () => {
    cosmDbg.hideUI();
  };

  handleSizeChange = () => {
    let modalSize = this.state.modalSize;

    if (modalSize === HeightSetting.small) {
      modalSize = HeightSetting.large;
    }
    else if (modalSize === HeightSetting.large) {
      modalSize = HeightSetting.collapsed;
    }
    else {
      modalSize = HeightSetting.small;
    }

    this.setPersistentState({ modalSize });
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

    const containerStyle = { ...CONTAINER_STYLE };
    if (this.state.modalSize === HeightSetting.large) {
      containerStyle.minWidth = 600;
    }
    else if (this.state.modalSize === HeightSetting.collapsed) {
      containerStyle.minWidth = 0;
    }

    let titleBarStyle = { ...TITLE_BAR_STYLE };
    this.state.hoverActive && (titleBarStyle.backgroundColor = '#344234');

    const tabStyle = { ...TAB_CONTENT_STYLE };
    if (this.state.modalSize === HeightSetting.collapsed) {
      tabStyle.display = 'none';
      titleBarStyle = { ...titleBarStyle, ...TITLE_BAR_STYLE_COLLAPSED };
    }

    return (
      <Draggable disabled={!this.state.allowDragging} handle={draggableHandles}>
        <div style={containerStyle} ref={this.ref}>
          <div className="cosm-dbg-handle" style={titleBarStyle}>
            <Icon name={pickIconByTime()}/>
            &nbsp;CosmDbg&nbsp;&nbsp;
            <div style={TITLE_BAR_BUTTONS}><Icon name='close' onClick={this.handleClose}/></div>
            <div style={TITLE_BAR_BUTTONS}><Icon name='sort' onClick={this.handleSizeChange}/></div>
            <div style={{ ...TITLE_BAR_BUTTONS, paddingRight: 2, }}>
              <Icon name='terminal' size='small' onClick={this.handleShowDevTools}/>
            </div>
            <div style={{ ...TITLE_BAR_BUTTONS, paddingRight: 6, }}>
              <Icon
                name={this.state.confirmingReload ? 'exclamation triangle' : 'redo'}
                size='small'
                onClick={this.handleReloadClick}
              />
            </div>
          </div>
          <Tab
            style={tabStyle}
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
