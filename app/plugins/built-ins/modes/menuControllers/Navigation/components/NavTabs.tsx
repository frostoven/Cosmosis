import React from 'react';
import { Button, Icon, Menu, Tab, TabPane, TabProps } from 'semantic-ui-react';
import { SolarSystemNav } from './SolarSystemNav';
import { LocalClusterNav } from './LocalClusterNav';
import { NavSettings } from './NavSettings';
import {
  RegisteredMenu,
} from '../../../../ReactBase/types/compositionSignatures';

const containerStyle: React.CSSProperties = {
  height: '100%',
};

const tabContainerStyle: React.CSSProperties = {
  height: '72%',
};

const paneStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  padding: '0 16px 0 16px',
  border: 'none',
  boxShadow: 'none',
  height: '100%',
  overflow: 'auto',
};

const nestedPane: React.CSSProperties = {
  ...paneStyle,
  padding: '0 17px 0 17px',
};

const rightAlignedTab: React.CSSProperties = {
  marginLeft: 'auto',
};

const simpleButtonStyle: React.CSSProperties = {
  border: 'none',
  boxShadow: 'none',
};

const statusStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 24,
  padding: 2,
  backgroundColor: '#53504d3d',
  borderTop: 'thin solid',
};

interface Props {
  className: string,
  pluginOptions: RegisteredMenu,
}

interface State {
  tabIndex: number,
}

class NavTabs extends React.Component<Props, State> {
  panes = [
    {
      menuItem: 'Solar System',
      render: () => (
        <TabPane attached={false} style={paneStyle}>
          <SolarSystemNav pluginOptions={this.props.pluginOptions}/>
        </TabPane>
      ),
    },
    {
      menuItem: 'Local Cluster',
      render: () => (
        <TabPane attached={false} style={paneStyle}>
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
        <Tab.Pane style={nestedPane}>
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
      --tabIndex < 0 && (tabIndex = this.panes.length - 1);
      this.setState({ tabIndex });
    }
    else if (actionName === 'right') {
      ++tabIndex >= this.panes.length && (tabIndex = 0);
      this.setState({ tabIndex });
    }
  };

  handleTabClick = (_: any, { activeIndex }: TabProps) => {
    this.setState({ tabIndex: activeIndex as number });
  };

  render() {
    return (
      <div className={this.props.className}
           style={containerStyle}>
        <Tab
          menu={{ secondary: true, pointing: true }}
          panes={this.panes}
          activeIndex={this.state.tabIndex}
          onTabChange={this.handleTabClick}
          style={tabContainerStyle}
        />

        <div style={statusStyle}>
          Controls shown here
        </div>
      </div>
    );
  }
}

export {
  NavTabs,
};
