import React from 'react';
import { Tab } from 'semantic-ui-react';

const TAB_STYLE = {
  maxHeight: 400,
  overflowX: 'hidden',
  overflowY: 'auto',
};

export default class DebuggerTab extends React.Component<any, any> {
  private ref: React.RefObject<unknown>;

  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  render() {
    return (
      // @ts-ignore
      <div style={TAB_STYLE}>
        <Tab.Pane>
          {this.props.children}
        </Tab.Pane>
      </div>
    );
  }
}
