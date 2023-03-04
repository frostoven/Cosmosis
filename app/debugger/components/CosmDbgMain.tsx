import React from 'react';
import { Tab } from 'semantic-ui-react';
import { genVariableHijacker } from '../modules/variableHijacker';

const panes = [
  genVariableHijacker(),
  { menuItem: 'CosmDbg', render: () => <Tab.Pane>TBD</Tab.Pane> },
];

export default class CosmDbgMain extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <Tab panes={panes}/>
    );
  }
}
