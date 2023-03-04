import { Tab } from 'semantic-ui-react';
import React from 'react';
import VariableHijacker from './VariableHijacker';

function genVariableHijacker() {
  return {
    menuItem: 'Var Hijacker',
    render: () => (
      <Tab.Pane>
        <VariableHijacker/>
      </Tab.Pane>
    ),
  };
}

export {
  genVariableHijacker,
}
