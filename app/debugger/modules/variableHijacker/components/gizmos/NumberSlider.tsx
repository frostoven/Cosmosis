import React from 'react';
import { Button, Form, Icon } from 'semantic-ui-react';
import GizmoInput from './GizmoInput';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  borderLeft: '2px solid #d2d2d2',
  marginTop: 4,
  marginLeft: 3,
  padding: 4,
  paddingLeft: 19,
};

const BUTTON_STYLE = {
  margin: 0,
};

const INPUT_STYLE = {
  color: '#ffffff',
  backgroundColor: '#565b5d',
};

const SLIDER_STYLE = {
  width: '100%',
};

interface Props {
}

export default class NumberSlider extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    // const iconComponent = this.props.iconComponent;

    return (
      <div style={CONTAINER_STYLE}>
        <Button style={BUTTON_STYLE}>-</Button>
        <GizmoInput defaultValue={'0x00'}/>
        <Button style={BUTTON_STYLE}>+</Button>
        &nbsp;
        <Button positive={false} style={{ width: 55 }}>
          <Icon name="unlock"/>
        </Button>
        <br/>
        <input
          type='range'
          min={-1}
          max={100}
          value={24}
          // onChange={this.handleSliderChange}
          style={SLIDER_STYLE}
        />

        <div>
          Min: [] | Max: []
        </div>
      </div>
    );
  }
}
