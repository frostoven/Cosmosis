import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import Hijacker from '../../Hijacker';
import ChangeTracker from 'change-tracker/src';
import TextInput from '../subcomponents/TextInput';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  borderLeft: '2px solid #d2d2d2',
  marginTop: 4,
  marginLeft: 3,
  padding: 4,
  paddingLeft: 19,
};

const LOCK_STYLE = {
  backgroundColor: '#595e60',
  width: 53,
};

interface Props {
  // The name of the variable you wish to control.
  targetName: string,
  // The parent object instance that your target is a child of.
  parent: object,
}

export default class StringEditor extends React.Component<Props> {
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

  hijackTarget = () => {
    const { parent, targetName } = this.props;
    if (!parent || !targetName) {
      return;
    }

    this.hijacker.setParent(parent);
    this.hijacker.override(
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

    const lockStyle = { ...LOCK_STYLE };
    this.state.locked && (lockStyle.backgroundColor = '#485563');

    return (
      <div style={CONTAINER_STYLE}>
        <TextInput valueTracker={this.valueTracker} valueStore={this.hijacker.valueStore}>
          <Button positive={false} style={lockStyle} onClick={this.toggleLock}>
            <Icon name={this.state.locked ? 'lock' : 'unlock'}/>
          </Button>
        </TextInput>
      </div>
    );
  }
}
