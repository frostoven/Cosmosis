import React from 'react';
import { Button } from 'semantic-ui-react';
import TextInput from './TextInput';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  marginTop: 0,
  padding: 0,
  display: 'inline',
};

const BUTTON_STYLE = {
  margin: 0,
};

interface Props {
  defaultValue?: 0,
}

export default class NumericInput extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={CONTAINER_STYLE}>
        <Button style={BUTTON_STYLE}><b>-</b></Button>
        <TextInput defaultValue={this.props.defaultValue || 0}/>
        <Button style={BUTTON_STYLE}><b>+</b></Button>
      </div>
    );
  }
}
