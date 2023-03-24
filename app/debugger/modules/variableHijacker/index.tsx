import { Tab } from 'semantic-ui-react';
import React from 'react';
import VariableHijacker from './VariableHijacker';
import DebuggerTab from '../../components/DebuggerTab';

function genVariableHijacker(props) {
  return {
    menuItem: 'Var Hijacker',
    render: () => (
      <DebuggerTab>
        <VariableHijacker {...props}/>
      </DebuggerTab>
    ),
  };
}

export {
  genVariableHijacker,
}
