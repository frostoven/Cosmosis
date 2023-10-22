import React from 'react';
import InputBridge from '../types/InputBridge';
import KosmButton from '../components/KosmButton';

interface Props {
  options: {
    default?: number,
    entries: { name: string, onSelect: Function }[],
  },
  style: object,
  // Used to override what the 'next item' action is. Defaults to 'up'.
  actionNext?: string,
  // Used to override what the 'previous item' action is. Defaults to 'down'.
  actionPrevious?: string,
}

export default class MenuVertical extends React.Component<Props> {
  private _input = new InputBridge();
  public static defaultProps = {
    style: {},
    actionNext: 'down',
    actionPrevious: 'up',
  };

  state = {
    selected: null,
  };

  componentDidMount() {
    this._input.onAction.getEveryChange(this.handleAction);
    const defaultIndex = this.props.options.default;
    if (this.state.selected === null && typeof defaultIndex === 'number') {
      this.setState({ selected: defaultIndex });
    }
  }

  componentWillUnmount() {
    this._input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (action: string) => {
    const entries = this.props.options?.entries;
    if (!entries?.length) {
      return;
    }

    let selected = this.state.selected || 0;

    if (action === 'select') {
      return this.select(selected);
    }

    const next = this.props.actionNext;
    const previous = this.props.actionPrevious;
    let direction: number;
    if (action === previous) {
      direction = -1;
    }
    else if (action === next) {
      direction = 1;
    }
    else {
      return;
    }

    selected += direction;
    if (selected < 0) {
      return this.setState({ selected: 0 });
    }
    else if (selected >= entries.length) {
      return this.setState({ selected: entries.length - 1 });
    }
    else {
      this.setState({ selected });
    }
  };

  select(index: number) {
    const entries = this.props.options?.entries;
    if (!entries?.length) {
      return;
    }

    const callback = entries[index].onSelect;
    if (typeof callback === 'function') {
      callback({ selected: index, ...entries[index] });
    }
  }

  render() {
    const entries = this.props.options?.entries;
    if (!entries?.length) {
      return <div>[no menu entries available]</div>;
    }

    const selected = this.state.selected || 0;

    return (
      <div style={this.props.style}>
        {entries.map((menuEntry, index) => {
          return (
              <KosmButton
                key={`MenuVertical-${index}`}
                selectable
                isActive={selected === index}
                wide
                block
                onClick={() => {
                  this.setState({ selected: index }, () => {
                    this.select(index);
                  });
                }}
              >
                {menuEntry.name}
              </KosmButton>
          )
        })}
      </div>
    );
  }
}

