import _ from 'lodash';
import React from 'react';
import { Tab } from 'semantic-ui-react';
import { genVariableHijacker } from '../modules/variableHijacker';
import { cosmDbg } from '../index';
import { genSettings } from '../modules/settings';

export default class CosmDbgMain extends React.Component {
  static defaultState = { rootActiveTab: 0 };
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
      <Tab
        activeIndex={activeTab}
        // @ts-ignore - definition is wrong.
        onTabChange={this.handleTabChange}
        panes={[
          genVariableHijacker({ rootUtils }),
          genSettings({ rootUtils }),
        ]}
      />
    );
  }
}
