import React from 'react';
import ChangeTracker from 'change-tracker/src';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  marginTop: 0,
  padding: 0,
  display: 'inline',
};

const BUTTON_STYLE = {
  margin: 0,
};

const INPUT_STYLE = {
  color: '#ffffff',
  backgroundColor: '#565b5d',
  border: 'thin solid black',
  cursor: 'text',
  marginTop: -0.0125,
};

const maxSmallChars = 12;

interface Props {
  defaultValue?: '',
  valueTracker: ChangeTracker,
  valueStore: { originalName: string | null; value: any },
}

export default class TextInput extends React.Component<Props> {
  state = { forceRerender: 0 };

  private readonly inputRef: React.RefObject<any>;
  private inputValue: string;
  private largeString: boolean;

  constructor(props) {
    super(props);
    this.inputValue = '';
    this.inputRef = React.createRef();
    this.largeString = false;
  }

  componentDidMount() {
    this.props.valueTracker.getEveryChange(this.updateRefValue.bind(this));
  }

  componentWillUnmount() {
    this.props.valueTracker.removeGetEveryChangeListener(this.updateRefValue);
  }

  updateRefValue = ({ valueStore, newValue }) => {
    this.inputRef.current.value = newValue;
    console.log('=====> inputRef:', this.inputRef.current);
    // This is intentional - we don't want to rerender now, but when we
    // eventually do, we want to have correct values.
    this.inputValue = newValue;
  };

  onUserInput = (event) => {
    const value = event.target.value;
    this.props.valueStore.value = value;
    this.inputValue = value;
    this.setState({ forceRerender: this.state.forceRerender + 1 });
  };

  render() {
    // TODO: if chars exceed max (12), then set this.largeString to true.
    //  If large, do textarea instead of input. Reuse props.
    //  Maybe: if chars < 10, setstate(small); if chars > 12, setstate(textarea)
    const value = this.inputValue || '';
    return (
      <div style={CONTAINER_STYLE}>
        <div className='ui input'>
          <input
            ref={this.inputRef}
            value={this.inputValue}
            onChange={this.onUserInput}
            style={INPUT_STYLE}
          />
        </div>
      </div>
    );
  }
}
