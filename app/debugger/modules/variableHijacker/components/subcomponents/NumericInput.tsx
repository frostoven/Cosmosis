import React from 'react';
import { Button } from 'semantic-ui-react';
import ChangeTracker from 'change-tracker/src';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  marginTop: 0,
  padding: 0,
  display: 'inline-flex',
  border: 'thin solid black',
  height: 38,
  width: 'fit-content',
  backgroundColor: '#53585a',
};

const BUTTON_STYLE = {
  margin: 0,
  borderTop: 'none',
  borderBottom: 'none',
};

const BUTTON_INNER = {
  fontWeight: 600,
};

const INPUT_STYLE = {
  color: '#ffffff',
  backgroundColor: '#565b5d',
  cursor: 'text',
  marginTop: 2,
};

interface Props {
  defaultValue?: 0,
  valueTracker: ChangeTracker,
  valueStore: { originalName: string | null; value: any },
  children?: any,
}

export default class NumericInput extends React.Component<Props> {
  state = { forceRerender: 0 };

  private readonly inputRef: React.RefObject<any>;
  private inputValue: number;
  private refUpdateFunction: OmitThisParameter<({
    valueStore,
    newValue,
  }: { valueStore: any; newValue: any }) => void>;

  constructor(props) {
    super(props);
    this.inputValue = 0;
    this.inputRef = React.createRef();
    this.refUpdateFunction = this.updateRefValue.bind(this);
  }

  componentDidMount() {
    this.props.valueTracker.getEveryChange(this.refUpdateFunction);
  }

  componentWillUnmount() {
    const removed = this.props.valueTracker.removeGetEveryChangeListener(
      this.refUpdateFunction
    );
  }

  updateRefValue = ({ valueStore, newValue }) => {
    if (!this.inputRef.current) {
      return console.error('Invalid ref on NumericInput.');
    }
    this.inputRef.current.value = newValue;
    // This is intentional - we don't want to rerender now, but when we
    // eventually do, we want to have correct values.
    this.inputValue = newValue;
  };

  setValue(value) {
    let newValue = Number(value);
    if (!isNaN(newValue)) {
      // Only set the value if it's reasonable.
      this.props.valueStore.value = newValue;
    }
    this.inputValue = value;
    this.setState({ forceRerender: this.state.forceRerender + 1 });
  }

  onUserInput = (event) => {
    this.setValue(event.target.value);
  };

  changeValue = (direction) => {
    let value = this.props.valueStore.value;
    if ((value === 1 && direction === -1) || (value === -1 && direction === 1)) {
      // When counting as integers, snap to 0 as it's being approached.
      value = 0;
    }
    else {
      // Increment / decrement by 10%. Round if far from zero.
      value += direction * 0.1 * Math.abs(value);
      if (!value) {
        value = direction;
      }
      if (value >= 1 || value <= -1) {
        value = direction > 0
          ? Math.ceil(value)
          : Math.floor(value);
      }
    }
    this.setValue(value);
  };

  increment = () => {
    this.changeValue(1);
  };

  decrement = () => {
    this.changeValue(-1);
  };

  render() {
    return (
      <div style={CONTAINER_STYLE}>
        <Button style={{ ...BUTTON_STYLE, borderLeft: 'none' }} onClick={this.decrement}>
          <div style={BUTTON_INNER}>÷</div>
        </Button>
        <div className='ui input'>
          <input
            ref={this.inputRef}
            value={this.inputValue}
            onChange={this.onUserInput}
            type='number'
            style={INPUT_STYLE}
          />
        </div>
        <Button style={{ ...BUTTON_STYLE, borderRight: 'none' }} onClick={this.increment}>
          <div style={BUTTON_INNER}>x</div>
        </Button>
        {this.props.children}
      </div>
    );
  }
}
