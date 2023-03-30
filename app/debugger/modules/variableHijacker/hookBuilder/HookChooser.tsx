import React from 'react';
import { Button } from 'semantic-ui-react';
import ChangeTracker from 'change-tracker/src';
import { randomArrayItem } from '../../../../local/utils';
import ObjectScanner from '../components/ObjectScanner';
import {
  CosmDbgRootUtils
} from '../../../components/interfaces/CosmDbgRootUtils';
import { cosmDbg } from '../../../index';

// When you can't decide... why not both? | Zoidberg™
let submitButtonName = randomArrayItem([
  'Hijack',
  'Control',
  'Take Control',
  'Sink Fangs',
  'Bite into',
  'Launch Tendrils',
  (Math.random() < 0.5 ? 'Launch' : 'Unleash') + ' Tentacles',
  'Unleash Kraken',
  'Annihilate',
  'Ravish',
  'Allure',
  'Titillate',
]);

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  borderLeft: '2px solid #d2d2d2',
  marginTop: 6,
  marginLeft: 3,
  padding: 4,
  paddingLeft: 19,
};

const EVAL_ERROR = {
  fontWeight: 'bold',
  backgroundColor: '#5d4c4c',
  border: 'thin solid #c17474',
  padding: 8,
};

const TEXT_AREA_STYLE = {
  height: 78,
};

export default class HookChooser extends React.Component<{ rootUtils: CosmDbgRootUtils }> {
  defaultState = {
    parentAreaText: '',
    childAreaText: '',
    evalError: '',
    targetParent: null,
    targetChildName: null,
  };

  state = { ...this.defaultState };

  private readonly valueTracker: ChangeTracker;

  constructor(props) {
    super(props);
    this.valueTracker = new ChangeTracker();
  }

  saveFormInfo = () => {
    cosmDbg.setOption('hookChooser', this.state);
  };

  onParentAreaChange = (event) => {
    this.setState({
      parentAreaText: event.target.value,
    });
  };

  onChildAreaChange = (event) => {
    this.setState({
      childAreaText: event.target.value,
    });
  };

  onSubmit = (event) => {
    const parentPath = this.state.parentAreaText;
    if (parentPath.trim() === 'window') {
      return this.setState({
        evalError: 'The window object itself cannot be hijacked, unfortunately.',
      });
    }

    let parent;
    try {
      parent = eval(parentPath);
    }
    catch (error: any) {
      console.error('[HookChooser]', error);
      return this.setState({
        evalError: `${error.message}`,
      });
    }

    if (typeof parent === 'undefined') {
      return this.setState({
        evalError: `${parentPath} is undefined.`,
      });
    }

    const childName = this.state.childAreaText;
    if (typeof parent[childName] === 'undefined') {
      const message = `Object '${parentPath}' does not have a property named '${childName}'.`;
      console.error('[HookChooser]', message);
      return this.setState({
        evalError: message,
      });
    }

    this.setState({
      targetParent: parent,
      targetChildName: childName,
    });
  };

  resetForm = () => {
    this.setState(this.defaultState)
  };

  render() {
    const { targetParent, targetChildName } = this.state;
    if (targetParent && targetChildName) {
      return (
        <div>
          <Button fluid onClick={this.resetForm}>Reset</Button>
          <ObjectScanner name={targetChildName} parent={targetParent}/>
        </div>
      )
    }

    return [
      <Button key={'Reset-Hook'} fluid onClick={this.resetForm}>Reset</Button>,
      <div key={'HookChooser-Container'} style={CONTAINER_STYLE}>
        Parent path:
        <br/>
        <textarea
          value={this.state.parentAreaText}
          onChange={this.onParentAreaChange}
          style={TEXT_AREA_STYLE}
          placeholder='Examples:&#10;• window.document&#10;• $gameRuntime'
        />
        <br/>
        <br/>

        Property name:
        <br/>
        <textarea
          value={this.state.childAreaText}
          onChange={this.onChildAreaChange}
          style={TEXT_AREA_STYLE}
          placeholder='Examples:&#10;• body&#10;• tracked'
        />
        <br/>
        {
          this.state.evalError
            ? <div style={EVAL_ERROR}>{this.state.evalError}</div>
            : ''
        }
        <br/>

        <Button onClick={this.onSubmit}>{submitButtonName}</Button>
      </div>,
    ];
  }
}
