import React from 'react';
import { Accordion, Tab } from 'semantic-ui-react';

const panes = [
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
