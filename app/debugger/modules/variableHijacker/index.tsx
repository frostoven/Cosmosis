import { Tab } from 'semantic-ui-react';
import React from 'react';
import VariableHijacker from './VariableHijacker';

function genVariableHijacker(props) {
  return {
    menuItem: 'Var Hijacker',
    render: () => (
      <Tab.Pane>
        <VariableHijacker {...props}/>
      </Tab.Pane>
    ),
  };
}

export {
  genVariableHijacker,
}
