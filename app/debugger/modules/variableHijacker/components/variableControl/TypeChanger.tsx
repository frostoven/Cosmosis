import React from 'react';
import { Button } from 'semantic-ui-react';
import ChangeTracker from 'change-tracker/src';

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

interface Props {
  // The name of the variable you wish to control.
  targetName: string,
  // The parent object instance that your target is a child of.
  parent: object,
  // Forces parent to recheck child contents.
  repopulate: (event) => void,
}

export default class TypeChanger extends React.Component<Props> {
  state = {
    stringAreaText: '',
    evalAreaText: '',
    evalError: '',
  };

  private readonly valueTracker: ChangeTracker;

  constructor(props) {
    super(props);
    this.valueTracker = new ChangeTracker();

    const target = this.props.parent[props.targetName];
    if (target === null) {
      this.state.evalAreaText = 'null';
    }
    else if (target === 'undefined') {
      this.state.evalAreaText = 'undefined';
    }
    else if (target === 'string') {
      this.state.evalAreaText = target;
    }
  }

  onStringAreaChange = (event) => {
    this.setState({
      stringAreaText: event.target.value,
      evalAreaText: '',
    });
  };

  onEvalAreaChange = (event) => {
    this.setState({
      stringAreaText: '',
      evalAreaText: event.target.value,
    });
  };

  onSubmit = (event) => {
    let value;
    if (this.state.stringAreaText) {
      value =  this.state.stringAreaText;
    }
    else {
      try {
        value = eval(this.state.evalAreaText);
      }
      catch (error: any) {
        console.error('[TypeChanger]', error);
        this.setState({
          evalError: `${error.message}`,
        });
        return;
      }
    }

    this.props.parent[this.props.targetName] = value;
    this.setState({
      evalError: '',
    });
    this.props.repopulate(event);
  };

  render() {
    return (
      <div style={CONTAINER_STYLE}>
        // Options
        <br/>
        <br/>

        Set as string:
        <br/>
        <textarea
          value={this.state.stringAreaText}
          onChange={this.onStringAreaChange}
        />
        <br/>
        <br/>

        Set by eval:
        <br/>
        <textarea
          value={this.state.evalAreaText}
          onChange={this.onEvalAreaChange}
        />
        <br/>
        {
          this.state.evalError
            ? <div style={EVAL_ERROR}>{this.state.evalError}</div>
            : ''
        }
        <br/>

        <Button onClick={this.onSubmit}>Commit</Button>
      </div>
    );
  }
}
