import React from 'react';
import Hijacker from '../../Hijacker';
import ChangeTracker from 'change-tracker/src';
import TextInput from '../subcomponents/TextInput';
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

export default class StringEditor extends React.Component<Props> {
  state = { targetIsViable: false, locked: false, readonly: false };

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

  hijackTarget = () => {
    const { parent, targetName } = this.props;
    if (!parent || !targetName) {
      return;
    }

    this.hijacker.setParent(parent);
    const overrideSuccessful = this.hijacker.override(
      targetName,
      () => {},
      ({ originalSet, valueStore }, newValue) => {
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

  render() {
    if (!this.state.targetIsViable) {
      return (
        <div style={{ display: 'inline' }}>
          &nbsp;
          [ target not viable ]
        </div>
      );
    }

    const readonly = this.state.readonly;

    return (
      <div style={CONTAINER_STYLE}>
        {readonly && <i>Variable is read-only and cannot be edited.</i>}
        <TextInput
          valueTracker={this.valueTracker}
          valueStore={this.hijacker.valueStore}
          disabled={readonly}
        >
          <LockButton
            locked={this.state.locked}
            onClick={this.toggleLock}
            disabled={readonly}
          />
        </TextInput>
      </div>
    );
  }
}
