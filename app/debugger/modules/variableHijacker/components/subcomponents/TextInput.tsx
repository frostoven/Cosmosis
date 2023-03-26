import React from 'react';
import ChangeTracker from 'change-tracker/src';
import { Button } from 'semantic-ui-react';

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
  fontFamily: 'inherit',
  color: '#ffffff',
  backgroundColor: '#565b5d',
  border: 'thin solid black',
  cursor: 'text',
  marginTop: 2,
  width: '100%',
};

const maxSmallChars = 12;

interface Props {
  defaultValue?: '',
  valueTracker: ChangeTracker,
  valueStore: { originalName: string | null; value: any },
  children: any,
}

export default class TextInput extends React.Component<Props> {
  state = {
    useLargeTextArea: false,
    forceRerender: 0,
  };

  private readonly inputRef: React.RefObject<any>;
  private inputValue: string;
  private largeString: boolean;
  private refUpdateFunction: OmitThisParameter<({
    valueStore,
    newValue,
  }: { valueStore: any; newValue: any }) => void>;
  private lowTextSwitch: number;
  private highTextSwitch: number;

  constructor(props) {
    super(props);
    this.inputValue = '';
    this.inputRef = React.createRef();
    this.largeString = false;
    this.refUpdateFunction = this.updateRefValue.bind(this);

    this.lowTextSwitch = 6;
    this.highTextSwitch = 16;
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
    this.inputRef.current.value = newValue;
    // This is intentional - we don't want to rerender now, but when we
    // eventually do, we want to have correct values.
    this.inputValue = newValue;
    this.testNewlineAndSet();
  };

  onUserInput = (event) => {
    const value = event.target.value;
    this.props.valueStore.value = value;
    this.inputValue = value;
    this.setState({ forceRerender: this.state.forceRerender + 1 });
  };

  toggleTextAreaSize = () => {
    this.setState({ useLargeTextArea: !this.state.useLargeTextArea });
  };

  testNewlineAndSet() {
    if (!this.state.useLargeTextArea && /[\r\n]/.test(this.inputValue)) {
      // Prevent text linebreak corruption.
      setTimeout(() => {
        this.setState({ useLargeTextArea: true });
      });
      return true;
    }

    return false;
  }

  render() {
    // Prevent text linebreak corruption.
    if (this.testNewlineAndSet()) {
      return null;
    }

    const value = this.inputValue || '';

    return (
      <div>
        <Button onClick={this.toggleTextAreaSize}>
          Text input: {this.state.useLargeTextArea ? 'multiline' : 'single'}
        </Button>
        {this.props.children}
        <br/>
        <div style={CONTAINER_STYLE}>
          <div className='ui input' style={{ width: '100%', fontFamily: 'inherit' }}>
            {
              this.state.useLargeTextArea
              ? (
                  <textarea
                    ref={this.inputRef}
                    value={this.inputValue}
                    onChange={this.onUserInput}
                    style={{ ...INPUT_STYLE, padding: 14, }}
                  />
                )
              : (
                  <input
                    ref={this.inputRef}
                    value={this.inputValue}
                    onChange={this.onUserInput}
                    style={INPUT_STYLE}
                  />
                )
            }
          </div>
        </div>
      </div>
    );
  }
}
