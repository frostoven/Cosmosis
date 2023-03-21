import React from 'react';

const INPUT_STYLE = {
  color: '#ffffff',
  backgroundColor: '#565b5d',
};

const SLIDER_STYLE = {
  width: '100%',
};

interface Props {
  min?: number,
  max?: number,
  value?: number,
}

export default class NumericSlider extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  handleSliderChange = () => {
    console.log('Slider change.');
  };

  render() {
    return (
      <input
        type='range'
        min={this.props.min || -10}
        max={this.props.max || 10}
        value={this.props.value || 0}
        onChange={this.handleSliderChange}
        style={SLIDER_STYLE}
      />
    );
  }
}
