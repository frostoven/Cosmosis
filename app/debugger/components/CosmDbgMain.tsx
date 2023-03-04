import React from 'react';
import { Tab } from 'semantic-ui-react';
import { genVariableHijacker } from '../modules/variableHijacker';
import { cosmDbg } from '../index';

export default class CosmDbgMain extends React.Component {
  state: { [key: string]: any } = {};

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

  handleTabChange = (event, { activeIndex }) => {
    this.setRootState({ rootActiveTab: activeIndex });
  };

  render() {
    const rootUtils = {
      rootState: this.state,
      setRootState: this.setRootState,
      test: () => alert('Props passed through correctly.'),
    };

    return (
      <Tab
        activeIndex={this.state.rootActiveTab}
        // @ts-ignore - definition is wrong.
        onTabChange={this.handleTabChange}
        panes={[
          genVariableHijacker({ rootUtils }),
          { menuItem: 'Settings', render: () => <Tab.Pane>TBD</Tab.Pane> },
        ]}
      />
    );
  }
}
