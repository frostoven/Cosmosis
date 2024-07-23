import React from 'react';
import { Button, Icon, Menu, Tab, TabPane } from 'semantic-ui-react';

const rightAlignedTab: React.CSSProperties = {
  marginLeft: 'auto',
};

const simpleButtonStyle: React.CSSProperties = {
  border: 'none',
  boxShadow: 'none',
};

class NavTabs extends React.Component {
  static panes = [
    {
      menuItem: 'Tab 1',
      render: () => <TabPane attached={false}>Tab 1 Content</TabPane>,
    },
    {
      menuItem: 'Tab 2',
      render: () => <TabPane attached={false}>Tab 2 Content</TabPane>,
    },
    {
      menuItem: (
        <Menu.Item key="messages" style={rightAlignedTab}>
          <Button inverted icon style={simpleButtonStyle}>
            <Icon name="cog"/>
          </Button>
        </Menu.Item>
      ),
      render: () => <Tab.Pane>Tab 4 Content</Tab.Pane>,
    },
  ];

  constructor(props: {} | Readonly<{}>) {
    super(props);
  }

  render() {
    return (
      <div>
        <Tab menu={{ secondary: true, pointing: true }} panes={NavTabs.panes}/>
      </div>
    );
  }
}

export {
  NavTabs,
};
