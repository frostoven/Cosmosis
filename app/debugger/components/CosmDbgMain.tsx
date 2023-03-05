import _ from 'lodash';
import React from 'react';
import { Icon, Tab } from 'semantic-ui-react';
import Draggable from 'react-draggable'
import { genVariableHijacker } from '../modules/variableHijacker';
import { cosmDbg } from '../index';
import { genSettings } from '../modules/settings';

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
  static defaultState = { rootActiveTab: 0, isCollapsed: false };
  state: { [key: string]: any } = { ...CosmDbgMain.defaultState };

  constructor(props) {
    super(props);
    this.state = cosmDbg.getState()?.uiState || {};
  }

  // By storing all state in the debugger root, we can easily save exact state
  // and restore it during reboots. The purpose is to give the feel that the
  // debugger keeps running across code-change-induced reboots.
  setRootState = (state) => {
    this.setState(state, () => {
      cosmDbg.setOption('uiState', this.state);
    });
  };

  resetRootState = () => {
    const newState = {};
    _.each(this.state, (value, key) => {
      newState[key] = null;
    });

    this.setState({
      ...CosmDbgMain.defaultState,
      ...newState,
    }, () => {
      cosmDbg.resetState();
    });
  };

  handleTabChange = (event, { activeIndex }) => {
    this.setRootState({ rootActiveTab: activeIndex });
  };

  handleClose = () => {
    cosmDbg.hideUI();
  };

  handleCollapse = () => {
    this.setRootState({ isCollapsed: !this.state.isCollapsed });
  };

  render() {
    const rootUtils = {
      rootState: this.state,
      setRootState: this.setRootState,
      resetRootState: this.resetRootState,
      test: () => alert('Props passed through correctly.'),
    };

    let activeTab = this.state.rootActiveTab;
    if (activeTab === null || typeof activeTab === 'undefined') {
      activeTab = 0;
    }

    return (
      <Draggable
        handle=".cosm-dbg-handle"
        bounds={{ right: 148, top: 0 }}
      >
        <div style={CONTAINER_STYLE}>
          <div className="cosm-dbg-handle" style={TITLE_BAR_STYLE}>
            <Icon name='moon outline'/>
            &nbsp;CosmDbg&nbsp;&nbsp;
            {/* @ts-ignore */}
            <div style={TITLE_BAR_BUTTONS}><Icon name='close' onClick={this.handleClose}/></div>
            {/* @ts-ignore */}
            <div style={TITLE_BAR_BUTTONS}><Icon name='sort' onClick={this.handleCollapse}/></div>
          </div>
          <Tab
            style={{ display: this.state.isCollapsed ? 'none' : 'block' }}
            activeIndex={activeTab}
            // @ts-ignore - definition is wrong.
            onTabChange={this.handleTabChange}
            panes={[
              genVariableHijacker({ rootUtils }),
              genSettings({ rootUtils }),
            ]}
          />
        </div>
      </Draggable>
    );
  }
}
