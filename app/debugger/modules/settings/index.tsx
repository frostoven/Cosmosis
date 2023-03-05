import { Tab } from 'semantic-ui-react';
import React from 'react';
import Settings from './Settings';
import { TAB_STYLE } from '../../style';

function genSettings(props) {
  return {
    menuItem: 'Settings',
    render: () => (
      <Tab.Pane style={TAB_STYLE}>
        {<Settings {...props}/>}
      </Tab.Pane>
    ),
  };
}

export {
  genSettings,
}
