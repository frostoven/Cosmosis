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
}

export default class NumberEditor extends React.Component<Props> {
  state = { targetIsViable: false, locked: false };

  private hijacker: Hijacker;
  private readonly valueTracker: ChangeTracker;

  constructor(props) {
    super(props);
    this.hijacker = new Hijacker();
    this.valueTracker = new ChangeTracker();
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
    this.hijacker.override(
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
    );

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

    if (this.props.simplified) {
      return (
        <div style={{...(this.props.style || {})}}>
          <NumericInput valueTracker={this.valueTracker} valueStore={this.hijacker.valueStore} compact/>
            &nbsp;
          <LockButton locked={this.state.locked} onClick={this.toggleLock}/>
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <NumericInput valueTracker={this.valueTracker} valueStore={this.hijacker.valueStore}/>
        &nbsp;
        <LockButton locked={this.state.locked} onClick={this.toggleLock}/>
        <br/>

        {/* Prevent factions by hiding component near zero (<input> doesn't support them) */}
        {
          absStoreValue < 1 && absStoreValue !== 0
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
