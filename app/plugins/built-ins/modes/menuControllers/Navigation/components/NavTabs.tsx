import React from 'react';
import { Button, Icon, Menu, Tab, TabPane, TabProps } from 'semantic-ui-react';
import { SolarSystemNav } from './SolarSystemNav';
import { LocalClusterNav } from './LocalClusterNav';
import { NavSettings } from './NavSettings';
import {
  RegisteredMenu,
} from '../../../../ReactBase/types/compositionSignatures';

const rightAlignedTab: React.CSSProperties = {
  marginLeft: 'auto',
};

const simpleButtonStyle: React.CSSProperties = {
  border: 'none',
  boxShadow: 'none',
};

interface Props {
  className: string,
  pluginOptions: RegisteredMenu,
}

interface State {
  tabIndex: number,
}

class NavTabs extends React.Component<Props, State> {
  static panes = [
    {
      menuItem: 'Solar System',
      render: () => (
        <TabPane attached={false}>
          <SolarSystemNav/>
        </TabPane>
      ),
    },
    {
      menuItem: 'Local Cluster',
      render: () => (
        <TabPane attached={false}>
          <LocalClusterNav/>
        </TabPane>
      ),
    },
    {
      menuItem: (
        <Menu.Item key="messages" style={rightAlignedTab}>
          <Button inverted icon style={simpleButtonStyle}>
            <Icon name="cog"/>
          </Button>
        </Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <NavSettings/>
        </Tab.Pane>
      ),
    },
  ];

  state = {
    tabIndex: 0,
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
  }

  componentDidMount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.getEveryChange(this.handleAction);
  }

  componentWillUnmount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (actionName: string) => {
    let tabIndex = this.state.tabIndex;
    if (actionName === 'left') {
      --tabIndex < 0 && (tabIndex = NavTabs.panes.length - 1);
      this.setState({ tabIndex });
    }
    else if (actionName === 'right') {
      ++tabIndex >= NavTabs.panes.length && (tabIndex = 0);
      this.setState({ tabIndex });
    }
  };

  handleTabClick = (_: any, { activeIndex }: TabProps) => {
    this.setState({ tabIndex: activeIndex as number });
  };

  render() {
    return (
      <div className={this.props.className}>
        <Tab
          menu={{ secondary: true, pointing: true }}
          panes={NavTabs.panes}
          activeIndex={this.state.tabIndex}
          onTabChange={this.handleTabClick}
        />
      </div>
    );
  }
}

export {
  NavTabs,
};
