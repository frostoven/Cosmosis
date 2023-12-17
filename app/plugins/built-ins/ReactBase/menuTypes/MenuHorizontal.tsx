import React from 'react';
import MenuBasic, { MenuBasicProps } from './MenuBasic';

export default class MenuHorizontal extends React.Component<MenuBasicProps> {
  public render() {
    return (
      <MenuBasic
        {...this.props}
        inlineButtons
        actionsNext={[ 'right', 'down' ]}
        actionsPrevious={[ 'left', 'up' ]}
      />
    );
  }
}
