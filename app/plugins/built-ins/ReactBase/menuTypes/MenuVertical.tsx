import React from 'react';
import MenuBasic, { MenuBasicProps } from './MenuBasic';

export default class MenuVertical extends React.Component<MenuBasicProps> {
  public render() {
    return (
      <MenuBasic
        {...this.props}
        actionsNext={[ 'down' ]}
        actionsPrevious={[ 'up' ]}
      />
    );
  }
}
