import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import NumericSlider from '../subcomponents/NumericSlider';
import NumericInput from '../subcomponents/NumericInput';
import NumberSliderRange from '../subcomponents/NumberSliderRange';
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

  render() {
    if (!this.state.targetIsViable) {
      return (
        <div style={{ display: 'inline' }}>
          &nbsp;
          [ target not viable ]
        </div>
      );
    }

    return (
      <div style={CONTAINER_STYLE}>
        <NumericInput valueTracker={this.valueTracker} valueStore={this.hijacker.valueStore}/>
        &nbsp;
        <LockButton locked={this.state.locked} onClick={this.toggleLock}/>
        <br/>
        <NumericSlider min={-1} max={100} value={24}/>
        {/*<NumberSliderRange/>*/}
      </div>
    );
  }
}
