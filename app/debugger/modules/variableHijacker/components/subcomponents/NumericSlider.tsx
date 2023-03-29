import React, { ChangeEvent } from 'react';

const INPUT_STYLE = {
  color: '#ffffff',
  backgroundColor: '#565b5d',
};

const SLIDER_STYLE = {
  width: '100%',
};

interface Props {
  valueStore: { value: number },
  onChange: (event: ChangeEvent<HTMLInputElement>) => void,
}

export default class NumericSlider extends React.Component<Props> {
  private readonly initialFraction: number;

  constructor(props) {
    super(props);
    // To prevent values from blowing up, this is only set when the component
    // is created, meaning we have the slider in a reasonable relative range.
    // This component is used in a collapsable tree structure, meaning the user
    // can then just collapse/expand to make the slider accept a new relative
    // value.
    this.initialFraction = Math.ceil(this.props.valueStore.value * 0.1);
  }

  handleSliderChange = () => {
    console.log('Slider change.');
  };

  calculateMin = () => {
    let value = this.props.valueStore.value - this.initialFraction;
    if (Math.abs(value) < 1) {
      return -1;
    }
    if (isNaN(value)) {
      return -10;
    }
    return Math.round(value);
  };

  calculateMax = () => {
    let value = this.props.valueStore.value + this.initialFraction;
    if (Math.abs(value) < 1) {
      return 1;
    }
    if (isNaN(value)) {
      return 10;
    }
    return Math.round(value);
  };

  render() {
    return (
      <input
        type='range'
        min={this.calculateMin()}
        max={this.calculateMax()}
        value={this.props.valueStore.value}
        onChange={this.props.onChange}
        style={SLIDER_STYLE}
      />
    );
  }
}
