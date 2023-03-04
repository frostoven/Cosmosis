import { Tab } from 'semantic-ui-react';
import React from 'react';
import Settings from './Settings';

function genSettings(props) {
  return {
    menuItem: 'Settings',
    render: () => (
      <Tab.Pane>
        {<Settings {...props}/>}
      </Tab.Pane>
    ),
  };
}

export {
  genSettings,
}
