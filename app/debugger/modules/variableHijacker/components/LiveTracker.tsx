import React from 'react';
import { Button } from 'semantic-ui-react';
import TypeImageIcon from './TypeImageIcon';

const BUTTON_STYLE = {
  display: 'block',
  textAlign: 'left',
  marginBottom: -1,
};

interface Props {
  type: string,
  typeInfo: any,
  treeObject: any,
}

export default class LiveTracker extends React.Component<Props>{
  constructor(props) {
    super(props);
  }

  render() {
    const { type, treeObject: { key, value }, typeInfo } = this.props;
    let text;
    if (typeInfo.stringCompatible) {
      text = `${key}: ${value}`;
    }
    else {
      text = `${key}`;
    }

    return (
      <Button fluid style={BUTTON_STYLE}>
        <TypeImageIcon name={typeInfo.friendlyName}/>
        {text}
      </Button>
    );
  }
}
