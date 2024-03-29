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

const INPUT_STYLE: React.CSSProperties = {
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
  compact?: boolean,
  disabled?: boolean,
}

export default class NumericInput extends React.Component<Props> {
  state = { forceRerender: 0 };

  private readonly inputRef: React.RefObject<any>;
  private inputValue: number;
  private readonly refUpdateFunction: OmitThisParameter<({
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
    this.props.valueTracker.removeGetEveryChangeListener(this.refUpdateFunction);
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
    const valueStore = this.props.valueStore;
    if (!isNaN(newValue)) {
      // Only set the value if it's reasonable.
      valueStore.value = newValue;
    }
    this.inputValue = value;
    this.setState({ forceRerender: this.state.forceRerender + 1 });
    // TODO: actually setting the value as new is unnecessary - we should
    //  probably implement a re-notify function in ChangeTracker and call it
    //  here.
    this.props.valueTracker.setValue({ valueStore, newValue });
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
    const inputStyle = { ...INPUT_STYLE };
    if (this.props.compact) {
      inputStyle.width = 140;
    }

    let value: number | string = this.inputValue;
    if (isNaN(value)) {
      value = '';
    }

    const buttonSub = { ...BUTTON_STYLE, borderLeft: 'none' };
    const buttonAdd = { ...BUTTON_STYLE, borderRight: 'none' };
    const disabled = !!this.props.disabled;

    return (
      <div style={CONTAINER_STYLE}>
        <Button style={buttonSub} onClick={this.decrement} disabled={disabled}>
          <div style={BUTTON_INNER}>÷</div>
        </Button>
        <div className='ui input'>
          <input
            ref={this.inputRef}
            value={value}
            onChange={this.onUserInput}
            type='number'
            style={inputStyle}
            disabled={disabled}
          />
        </div>
        <Button style={buttonAdd} onClick={this.increment} disabled={disabled}>
          <div style={BUTTON_INNER}>x</div>
        </Button>
        {this.props.children}
      </div>
    );
  }
}
