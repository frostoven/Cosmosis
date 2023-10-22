import React from 'react';
import InputBridge from '../types/InputBridge';

interface Props {
  options: {
    type: string,
    default?: number,
    entries: { name: string, onSelect: Function }[],
  },
  style: object,
}

export default class MenuVertical extends React.Component<Props> {
  private _input = new InputBridge();
  public static defaultProps = {
    style: {},
  };

  state = {
    lastAction: 'none',
    selected: null,
  };

  componentDidMount() {
    this._input.onAction.getEveryChange(this.handleAction);
  }

  componentWillUnmount() {
    this._input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (action: string) => {
    if (action === 'up') {
      console.log({ action });
      this.setState({ lastAction: action });
    }
    else if (action === 'down') {
      console.log({ action });
      this.setState({ lastAction: action });
    }
  };

  render() {
    let selected = this.state.selected || 0;
    if (this.state.selected === null && typeof this.props.options.default === 'number') {
      selected = this.props.options.default;
    }

    return (
      <div style={this.props.style}>
        {this.state.lastAction} {Date.now()}
      </div>
    );
  }
}

