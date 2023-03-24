import React from 'react';
import Settings from './Settings';
import DebuggerTab from '../../components/DebuggerTab';

function genSettings(props) {
  return {
    menuItem: 'Settings',
    render: () => (
      <DebuggerTab>
        {<Settings {...props}/>}
      </DebuggerTab>
    ),
  };
}

export {
  genSettings,
}
