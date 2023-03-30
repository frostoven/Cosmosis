import React from 'react';
import NumericSlider from '../subcomponents/NumericSlider';
import NumericInput from '../subcomponents/NumericInput';
import Hijacker from '../../Hijacker';
import ChangeTracker from 'change-tracker/src';
import LockButton from '../subcomponents/LockButton';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  borderLeft: '2px solid #d2d2d2',
  marginTop: 4,
  marginLeft: 3,
  padding: 4,
  paddingLeft: 19,
};

interface Props {
  // The name of the variable you wish to control.
  targetName: string,
  // The parent object instance that your target is a child of.
  parent: object,
  // If true, does not include spacing and slider.
  simplified?: boolean,
  // Optional style overrides.
  style?: React.CSSProperties,
  // Allows the parent to ask for the NumberEditor's value tracker. Useful if
  // the parent needs values as the change. At time of writing, used by
  // GimbalEditor its cube bidirectionally control ref values.
  getChildValueTracker?: (ChangeTracker) => void,
}

export default class NumberEditor extends React.Component<Props> {
  state = { targetIsViable: false, locked: false, readonly: false };

  private hijacker: Hijacker;
  private readonly valueTracker: ChangeTracker;

  constructor(props) {
    super(props);
    this.hijacker = new Hijacker();
    this.valueTracker = new ChangeTracker();

    if (typeof this.props.getChildValueTracker === 'function') {
      this.props.getChildValueTracker(this.valueTracker);
    }
  }

  componentDidMount() {
    this.hijackTarget();
  }

  componentWillUnmount() {
    this.hijacker.undoHijack(this.props.targetName, true);
  }

  hijackTarget = () => {
    const { parent, targetName } = this.props;
    if (!parent || !targetName) {
      return;
    }

    this.hijacker.setParent(parent);
    const overrideSuccessful = this.hijacker.override(
      targetName,
      ({ originalGet, valueStore }) => {
        // console.log('-> getter:', valueStore.value);
        // if (typeof originalGet === 'function') {
        //   this.valueTracker.setValue({ valueStore, newValue: originalGet() });
        // }
      },
      // ({ originalSet, valueStore }, newValue) => {
      ({ originalSet, valueStore }, newValue) => {
        // valueStore.value = Math.floor(newValue * 10) / 10;
        // console.log('-> setter:', valueStore.value);
        if (!this.state.locked) {
          this.valueTracker.setValue({ valueStore, newValue });
        }
        else {
          return false;
        }
      },
      true,
    );

    if (!overrideSuccessful) {
      this.setState({ readonly: true });
    }

    this.valueTracker.setValue({
      valueStore: this.hijacker.valueStore,
      newValue: parent[targetName],
    });
    this.setState({ targetIsViable: true });
  };

  toggleLock = () => {
    this.setState({ locked: !this.state.locked });
  };

  onSliderChange = (event) => {
    this.hijacker.setValue(this.props.targetName, Number(event.target.value));
    console.log(this.hijacker.valueStore.value);
    this.setState({ forceRerender: Math.random() });
  };

  render() {
    if (!this.state.targetIsViable) {
      return (
        <div style={{ display: 'inline' }}>
          &nbsp;
          [ target not viable ]
        </div>
      );
    }

    const absStoreValue = Math.abs(this.hijacker.valueStore.value);
    const containerStyle = { ...CONTAINER_STYLE, ...(this.props.style || {}) };
    const readonly = this.state.readonly;

    if (this.props.simplified) {
      return (
        <div style={{...(this.props.style || {})}}>
          {readonly && <i>Variable is read-only and cannot be edited.</i>}
          <NumericInput
            valueTracker={this.valueTracker}
            valueStore={this.hijacker.valueStore}
            compact
            disabled={readonly}
          />
            &nbsp;
          <LockButton
            locked={this.state.locked}
            onClick={this.toggleLock}
            disabled={readonly}
          />
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        {readonly && <i>Variable is read-only and cannot be edited.</i>}
        <NumericInput
          valueTracker={this.valueTracker}
          valueStore={this.hijacker.valueStore}
          disabled={readonly}
        />
        &nbsp;
        <LockButton
          locked={this.state.locked}
          onClick={this.toggleLock}
          disabled={readonly}
        />
        <br/>

        {/* Prevent factions by hiding component near zero (<input> doesn't support them) */}
        {
          (absStoreValue < 1 && absStoreValue !== 0) || readonly
            ? null
            : <NumericSlider
                valueStore={this.hijacker.valueStore}
                onChange={this.onSliderChange}
              />
        }
      </div>
    );
  }
}
