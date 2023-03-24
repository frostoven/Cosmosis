import React from 'react';
import Actions from './Actions';
import DebuggerTab from '../../components/DebuggerTab';

function genActions(props) {
  return {
    menuItem: 'Actions',
    render: () => (
      <DebuggerTab>
        {<Actions {...props}/>}
      </DebuggerTab>
    ),
  };
}

export {
  genActions,
}
