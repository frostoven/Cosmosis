import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import NumericSlider from '../subcomponents/NumericSlider';
import NumericInput from '../subcomponents/NumericInput';
import NumberSliderRange from '../subcomponents/NumberSliderRange';
import Hijacker from '../../Hijacker';

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
  state = { targetIsViable: false };

  private hijacker: Hijacker | undefined;

  componentDidMount() {
    this.hijackTarget();
  }

  hijackTarget = () => {
    const { parent, targetName } = this.props;
    if (!parent || !targetName) {
      return;
    }

    // TODO: rewrite this demo to be generic. Specifically tested against
    //  shipPilot -> _throttlePosition.
    const hijacker = new Hijacker(parent);
    hijacker.override(
      targetName,
      ({ originalGet, reference }) => {
        // console.log('-> getter:', reference.value);
      },
      ({ originalSet, reference }, newValue) => {
        reference.value = Math.floor(newValue * 10) / 10;
        // console.log('-> setter:', reference.value);
        return false;
      },
    );

    console.log({ hijacker, parent });

    this.setState({ targetIsViable: true });
  };

  render() {
    // console.log('=> targetName:', this.props.targetName, 'parent:', this.props.parent);
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
        <NumericInput/>
        &nbsp;
        <Button positive={false} style={{ width: 55 }}>
          <Icon name="unlock"/>
        </Button>
        <br/>
        <NumericSlider min={-1} max={100} value={24}/>
        <NumberSliderRange/>
      </div>
    );
  }
}
