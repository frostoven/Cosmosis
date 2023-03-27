import React from 'react';
import ChangeTracker from 'change-tracker/src';
import { Checkbox } from 'semantic-ui-react';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  marginTop: 0,
  padding: 0,
  display: 'inline',
};

interface Props {
  valueTracker: ChangeTracker,
  valueStore: { originalName: string | null; value: any },
  children?: any,
}

let _instanceCount = 0;

export default class BoolToggle extends React.Component<Props> {
  state = { forceRerender: 0 };

  private readonly inputRef: React.RefObject<any>;
  private inputValue: boolean;
  // Needed for the checkbox label to work correctly.
  private inputId: number;
  private readonly refUpdateFunction: OmitThisParameter<({
    valueStore,
    newValue,
  }: { valueStore: any; newValue: any }) => void>;

  constructor(props) {
    super(props);
    this.inputValue = false;
    this.inputRef = React.createRef();
    this.inputId = ++_instanceCount;
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
      return console.error('Invalid ref on BoolToggle.');
    }
    this.inputRef.current.checked = newValue;
    // This is intentional - we don't want to rerender now, but when we
    // eventually do, we want to have correct values.
    this.inputValue = newValue;
  };

  toggleCheck = () => {
    this.inputValue = !this.inputValue;
    this.props.valueStore.value = this.inputValue;
    this.setState({ forceRerender: this.state.forceRerender + 1 });
  };

  render() {
    const inputId = `CosmDbg-BoolToggle-${this.inputId}`;

    return (
      <div style={CONTAINER_STYLE}>
        <div className="slideTwo" style={{ whiteSpace: 'nowrap' }}>
          <input
            id={inputId}
            ref={this.inputRef}
            type="checkbox"
            checked={this.inputValue ? true : false}
            onChange={this.toggleCheck}
          />
          <label htmlFor={inputId}/>
          {this.props.children}
        </div>
      </div>
    );
  }
}
