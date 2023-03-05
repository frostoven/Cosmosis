import { Tab } from 'semantic-ui-react';
import React from 'react';
import VariableHijacker from './VariableHijacker';
import { TAB_STYLE } from '../../style';

function genVariableHijacker(props) {
  return {
    menuItem: 'Var Hijacker',
    render: () => (
      <Tab.Pane style={TAB_STYLE}>
        <VariableHijacker {...props}/>
      </Tab.Pane>
    ),
  };
}

export {
  genVariableHijacker,
}
